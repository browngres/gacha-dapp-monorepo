// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// 访问控制
/// @dev flatten 中已经添加了 Initializable.sol ，所以不能再次导入
// import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

// Chainlink VRF
/// @dev 这是开发环境的 Mock 合约，生产环境需更换导入路径
import {VRFConsumerBaseV2PlusUpgradeable} from "./mock/VRF_Mock_flattened.sol";
import {VRFV2PlusClient} from "./mock/VRF_Mock_flattened.sol";
import {IVRFCoordinatorV2Plus} from "./mock/VRF_Mock_flattened.sol";

// 枚举类型
import {EnumerableSetLib} from "solady/src/utils/EnumerableSetLib.sol";

/// @dev Only in Hardhat simulated network
import "hardhat/console.sol";

/*
备忘： whenNotPaused, whenPaused, nonReentrant
*/

contract GachaPool is PausableUpgradeable, AccessControlUpgradeable, VRFConsumerBaseV2PlusUpgradeable {
    // * 【 类型声明 】
    /// @notice 稀有度
    /// @dev 如果不想要某个，不要删除，而是将其概率设置为 0
    enum Rarity {
        UR,
        SSR,
        SR,
        R,
        N
    }

    /// @dev 随机数的请求是否被 fulfilled， 使用集合来查找，这里不存
    struct RandomResult {
        uint8 numWords;
        uint256[] words;
        Rarity[] rarity;
    }

    struct PoolConfig {
        uint32 poolId; // 卡池 id
        uint32 supply; // 总量，最大抽卡次数
        uint64 costGwei; // 抽卡费用，单位 Gwei
        uint8 discountGachaTen; // 十连费用折扣，0-100
        bool guarantee; // 是否十连保底机制
        Rarity guaranteeRarity; // 保底稀有度
        uint8[] percentages; // 稀有度概率
        //TODO 如果改用定长数组，跟前面的槽位拼凑。是否节省 gas
    }

    struct PoolStorage {
        PoolConfig cfg;
        mapping(uint256 reqId => address roller) reqToAddress; // 抽卡的地址
        mapping(address roller => uint256[] requestIds) addressToReq; // 地址的抽卡记录
        mapping(uint256 reqId => RandomResult) requests; // 所有结果记录
        // TODO UR 记录
    }

    using EnumerableSetLib for EnumerableSetLib.Uint256Set;
    using EnumerableSetLib for EnumerableSetLib.AddressSet;

    // * 【 状态变量 】
    // ** 访问控制相关
    bytes32 private constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 private constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ** VRF 相关
    uint256 subId; // subscriptionId
    bytes32 keyHash;
    /// @dev // !! 根据 fulfillRandomWords 的需求设置 Gas limit。
    /// @dev // !! 不能太小。就算 fulfillRandomWords 失败也不会 revert。表现为没有存。
    uint32 constant CALLBACK_GAS_LIMIT = 10_000_000;
    uint16 constant REQUEST_CONFIRMATIONS = 1;
    IVRFCoordinatorV2Plus COORDINATOR; // VRF coordinator

    // ** GachaPool 配置相关
    /// @dev 大部分状态变量定义成 config，使用 ERC7201 存储布局
    uint32 constant PROCESSING_CAP = 100; // 未结算的请求数量限制
    address public claimSigner; // claim 签名者

    // ** GachaPool 记录相关
    /// @dev 映射存储使用 ERC7201 存储布局
    EnumerableSetLib.Uint256Set processingRequests; // 正在进行的 Request，reqId 集合
    EnumerableSetLib.Uint256Set fulfilledRequests; // 已经满足的 Request，reqId 集合
    EnumerableSetLib.Uint256Set claimedRequests; // 已经领取奖励的 Request，reqId 集合
    EnumerableSetLib.AddressSet allPlayers; // 所有玩过的玩家，地址集合
    // TODO 特权地址

    // ** ERC 7201 命名空间存储布局
    // keccak256(abi.encode(uint256(keccak256("Gacha.pool.storage")) - 1)) & ~bytes32(uint256(0xff));
    bytes32 private constant POOL_STORAGE_LOCATION = 0x683495bbd89dac7aefd058d15e147e478a054c63354d7884b208de21aad03f00;

    function _getPoolStorage() private pure returns (PoolStorage storage $) {
        assembly {
            $.slot := POOL_STORAGE_LOCATION
        }
    }

    // * 【 自定义错误 】
    error InvalidRarityPercentage();
    error InsufficientFunds();

    // * 【 自定义事件 】
    event GachaOne(address indexed who, uint256 requestId);
    event GachaTen(address indexed who, uint256 requestId);
    event RandomRequested(uint256 indexed requestId);
    event RandomFulfilled(uint256 indexed requestId, uint256[] randomWords);
    event PercentageChanged();
    event costGweiChanged(uint64 costGwei);
    event discountGachaTenChanged(uint8 discount);
    event Guaranteed(uint256 indexed requestId, Rarity);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        /// @dev 防止攻击者绕过代理直接调用实现合约的初始化
        _disableInitializers();
    }

    function initialize(
        uint256 _subId,
        address _vrfCoordinator,
        bytes32 _keyHash,
        address _admin,
        address _signer,
        PoolConfig calldata _initConfig
    ) public initializer {
        // * 访问控制
        __Pausable_init();
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
        // * VRF
        subId = _subId;
        keyHash = _keyHash;
        __VRFConsumerBaseV2Upgradeable_init(_vrfCoordinator);
        COORDINATOR = IVRFCoordinatorV2Plus(_vrfCoordinator);
        // * GachaPool
        PoolStorage storage $ = _getPoolStorage();
        $.cfg.poolId = _initConfig.poolId;
        $.cfg.supply = _initConfig.supply;
        $.cfg.costGwei = _initConfig.costGwei;
        $.cfg.discountGachaTen = _initConfig.discountGachaTen;
        $.cfg.guarantee = _initConfig.guarantee;
        $.cfg.guaranteeRarity = _initConfig.guaranteeRarity;
        claimSigner = _signer;
        // 分配概率
        _setPercentage(_initConfig.percentages);
    }

    // * 【 public 函数】

    /// @notice 单抽
    function gachaOne() public payable whenNotPaused returns (bytes32) {
        PoolStorage storage $ = _getPoolStorage();
        if (msg.value < $.cfg.costGwei * 1 gwei) {
            revert InsufficientFunds();
        }
        uint256 requestId = _requestRandomWords(1);
        $.reqToAddress[requestId] = msg.sender;
        $.addressToReq[msg.sender].push(requestId);
        /// @dev 更新请求的状态为：处理中
        processingRequests.add(requestId, PROCESSING_CAP);
        /// @dev 集合添加会自动去重
        allPlayers.add(msg.sender);
        emit GachaOne(msg.sender, requestId);
        // TODO 兑换码构造
        bytes32 code = keccak256("gacha");
        return code;
    }

    /// @notice 十连抽，费用打折
    /// @dev discountGachaTen 90 代表代表9折， 10% off
    function gachaTen() public payable whenNotPaused returns (bytes32) {
        PoolStorage storage $ = _getPoolStorage();
        if (msg.value < ($.cfg.costGwei * 1 gwei * $.cfg.discountGachaTen) / 10) {
            revert InsufficientFunds();
        }
        uint256 requestId = _requestRandomWords(10);
        $.reqToAddress[requestId] = msg.sender;
        $.addressToReq[msg.sender].push(requestId);
        processingRequests.add(requestId, PROCESSING_CAP);
        allPlayers.add(msg.sender);
        emit GachaTen(msg.sender, requestId);
        // TODO 兑换码构造
        bytes32 code = keccak256("gacha");
        return code;
    }

    /// 兑奖
    // function claim() returns () {}

    // * 【 admin 函数】

    function pause() public onlyRole(PAUSER_ROLE) {
        // TODO 如果有正在请求的随机数，不能暂停
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @notice 设置概率
    /// @dev 合约必须处于暂停
    function setPercentage(uint8[] calldata _percentages) public onlyRole(ADMIN_ROLE) whenPaused {
        _setPercentage(_percentages);
    }

    /// @notice 设置费用
    /// @dev 合约必须处于暂停
    function setCostGwei(uint64 _cost) public onlyRole(ADMIN_ROLE) whenPaused {
        PoolStorage storage $ = _getPoolStorage();
        $.cfg.costGwei = _cost;
        emit costGweiChanged(_cost);
    }

    /// @notice 设置十连折扣
    /// @dev 合约必须处于暂停
    function setDiscountGachaTen(uint8 _discount) public onlyRole(ADMIN_ROLE) whenPaused {
        PoolStorage storage $ = _getPoolStorage();
        $.cfg.discountGachaTen = _discount;
        emit discountGachaTenChanged(_discount);
    }

    /// 提取余额
    // function withdraw() onlyRole(ADMIN_ROLE) returns () {}

    // * 【 view 函数】
    /// @notice 返回使用的 VRF 合约地址
    /// @dev 真实的 VRF 合约是看不到往链上写的随机数的，Mock 版本则可以看到。
    function getAddressVRF() public view returns (address) {
        return address(COORDINATOR);
    }

    function poolId() public view returns (uint32) {
        return _getPoolStorage().cfg.poolId;
    }

    function supply() public view returns (uint32) {
        return _getPoolStorage().cfg.supply;
    }

    function costGwei() public view returns (uint64) {
        return _getPoolStorage().cfg.costGwei;
    }

    function discountGachaTen() public view returns (uint8) {
        return _getPoolStorage().cfg.discountGachaTen;
    }

    function guarantee() public view returns (bool) {
        return _getPoolStorage().cfg.guarantee;
    }

    function guaranteeRarity() public view returns (Rarity) {
        return _getPoolStorage().cfg.guaranteeRarity;
    }

    function percentages() public view returns (uint8[] memory) {
        return _getPoolStorage().cfg.percentages;
    }

    /// @notice 根据 reqId 查询抽卡的地址
    function getPlayer(uint256 reqId) public view returns (address) {
        return _getPoolStorage().reqToAddress[reqId];
    }

    /// @notice 根据地址查询抽卡的记录
    function getRequests(address by) public view returns (uint256[] memory) {
        return _getPoolStorage().addressToReq[by];
    }

    /// @notice 查询抽卡结果
    /// @param reqId requestId
    /// @return numWords 随机数个数
    /// @return words 随机数数组
    /// @return rarity 稀有度数组
    function getResult(uint256 reqId) public view returns (uint8, uint256[] memory, Rarity[] memory) {
        RandomResult storage result = _getPoolStorage().requests[reqId];
        return (result.numWords, result.words, result.rarity);
    }

    // * 【 internal/private 函数】

    function _requestRandomWords(uint8 numWords) private returns (uint256) {
        /// @dev Will revert if subscription is not set and funded.
        uint256 requestId = COORDINATOR.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subId,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: CALLBACK_GAS_LIMIT,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
            })
        );
        emit RandomRequested(requestId);
        return requestId;
    }

    /// @notice 被 VRF 调用，写入随机数的地方
    /// @param requestId requestId
    /// @param randomWords randomWords from vrf
    /// @dev never use revert in fulfillRandomWords
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        PoolStorage storage $ = _getPoolStorage();

        // 更新请求的状态为：已满足。
        processingRequests.remove(requestId);
        fulfilledRequests.add(requestId);

        // 记录结果
        /// @dev 另一种方法，使用指针指向存储区。多次操作存储浪费 gas
        // RandomResult storage result;
        // result = requests[requestId];
        RandomResult memory result;
        result.numWords = uint8(randomWords.length);
        result.words = randomWords;

        // 计算 rarity
        result.rarity = getRandomRarity(randomWords);

        // 保底机制，修改数组中的最后一个
        if (result.numWords == 10 && $.cfg.guarantee) {
            result.words[9] = 0;
            result.rarity[9] = $.cfg.guaranteeRarity;
            emit Guaranteed(requestId, $.cfg.guaranteeRarity);
        }

        $.requests[requestId] = result;
        // console.log("now ready to emit");
        emit RandomFulfilled(requestId, randomWords);
    }

    /// @notice 设置稀有度概率
    /// @param _percentages uint8 数组，从 UR 到 N
    /// @dev 加一起必须是100，如果不要某个，将其概率设置为0
    function _setPercentage(uint8[] calldata _percentages) private {
        PoolStorage storage $ = _getPoolStorage();

        if (_percentages.length != 5) {
            revert InvalidRarityPercentage();
        }
        uint sumPercentage;
        for (uint i; i < 5; i++) {
            sumPercentage += _percentages[i];
        }
        if (sumPercentage != 100) {
            revert InvalidRarityPercentage();
        }
        for (uint i; i < 5; i++) {
            $.cfg.percentages[i] = _percentages[i];
        }

        emit PercentageChanged();
    }

    /// @notice 计算稀有度
    /// @param randomWords 给定随机数，数组
    /// @return rarity 随机数的稀有度，数组
    /// @dev 从后往前遍历（N->R->SR->SSR->UR），概率大的先判断
    function getRandomRarity(uint256[] calldata randomWords) private view returns (Rarity[] memory rarity) {
        PoolStorage storage $ = _getPoolStorage();
        uint256 length = randomWords.length;
        rarity = new Rarity[](length);
        for (uint i = 0; i < length; i++) {
            uint8 word = uint8((randomWords[i] % 100) + 1); // 1-100
            // console.log("word:", word);
            uint8 cumulative = 0;
            for (uint8 j = 4; j >= 0; j--) {
                cumulative += $.cfg.percentages[j];
                // console.log("cumulative:", cumulative);
                if (word <= cumulative) {
                    rarity[i] = Rarity(j);
                    // console.log("already set rarity");
                    break;
                }
            }
        }
    }
}
