// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// 访问控制
/// @notice flatten 中已经添加了 Initializable.sol ，所以不能再次导入
// import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

// Chainlink VRF
/// @notice 这是开发环境的 Mock 合约，生产环境需更换导入路径
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

    // ** GachaPool 相关
    // ? 定义成 config
    uint32 public poolId; // 卡池 id
    uint32 public supply; // 总量，最大抽卡次数
    uint64 public costGwei; // 抽卡费用，单位 Gwei
    uint128 __gap1; // 预留槽位
    address public claimSigner; // claim 签名者
    uint32 constant PROCESSING_CAP = 100; // 未结算的请求数量限制

    // ** Gacha 运行相关
    mapping(Rarity => uint8) public percentages; // 稀有度概率
    mapping(uint256 reqId => address roller) public reqToAddress; // 抽卡的地址
    mapping(address roller => uint256[] requestIds) public addressToReq; // 地址的抽卡记录
    mapping(uint256 reqId => RandomResult) public requests; // 所有结果记录
    EnumerableSetLib.Uint256Set processingRequests; // 正在进行的 Request，reqId 集合
    EnumerableSetLib.Uint256Set fulfilledRequests; // 已经满足的 Request，reqId 集合
    EnumerableSetLib.Uint256Set claimedRequests; // 已经领取奖励的 Request，reqId 集合
    EnumerableSetLib.AddressSet allPlayers; // 所有玩过的玩家，地址集合
    // TODO 特权地址

    // * 【 自定义错误 】
    error InvalidRarityPercentage();

    // * 【 自定义事件 】
    event GachaOne(address indexed who, uint256 requestId);
    event GachaTen(address indexed who, uint256 requestId);
    event RandomRequested(uint256 indexed requestId);
    event RandomFulfilled(uint256 indexed requestId, uint256[] randomWords);
    event PercentageChanged();

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
        uint32 _poolId,
        uint32 _supply,
        uint64 _costGwei,
        address _signer,
        uint8[] calldata _percentages
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
        poolId = _poolId;
        supply = _supply;
        costGwei = _costGwei;
        claimSigner = _signer;

        // 分配概率
        _setPercentage(_percentages);
    }

    // * 【 public 函数】

    /// 单抽
    function gachaOne() public payable whenNotPaused returns (bytes32) {
        // TODO 检查付款
        console.log("now in gachaOne");
        uint256 requestId = _requestRandomWords(1);
        reqToAddress[requestId] = msg.sender;
        addressToReq[msg.sender].push(requestId);
        /// @dev 更新请求的状态为：处理中
        processingRequests.add(requestId, PROCESSING_CAP);
        /// @dev 集合添加会自动去重
        allPlayers.add(msg.sender);
        emit GachaOne(msg.sender, requestId);
        // TODO 兑换码构造
        bytes32 code = keccak256("gacha");
        return code;
    }

    /// 十连
    /// @notice 十连抽，费用打折
    // function gachaTen() returns () {}

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

    /// 设置费用，必须先暂停
    // function setCostGwei() onlyRole(ADMIN_ROLE) returns () {}

    /// 提取余额
    // function withdraw() onlyRole(ADMIN_ROLE) returns () {}

    // * 【 view 函数】
    /// @notice 返回使用的 VRF 合约地址
    /// @dev 真实的 VRF 合约是看不到往链上写的随机数的，Mock 版本则可以看到。
    function getAddressVRF() public view returns (address) {
        return address(COORDINATOR);
    }

    /// @notice 查询抽卡结果
    /// @param reqId requestId
    /// @return numWords 随机数个数
    /// @return words 随机数数组
    /// @return rarity 稀有度数组
    function getResult(uint256 reqId) public view returns (uint8, uint256[] memory, Rarity[] memory) {
        RandomResult storage result = requests[reqId];
        return (result.numWords, result.words, result.rarity);
    }

    // * 【 internal/private 函数】

    function _requestRandomWords(uint8 numWords) private returns (uint256) {
        /// @dev Will revert if subscription is not set and funded.
        console.log("now in _requestRandomWords");
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
        // 更新请求的状态为：已满足。
        console.log("now in fulfillRandomWords");
        processingRequests.remove(requestId);
        fulfilledRequests.add(requestId);
        // 记录结果
        // RandomResult storage result;
        // result = requests[requestId];
        RandomResult memory result;
        result.numWords = uint8(randomWords.length);
        result.words = randomWords;
        // 计算 rarity
        result.rarity = getRandomRarity(randomWords);
        requests[requestId] = result;
        console.log("now ready to emit");
        emit RandomFulfilled(requestId, randomWords);
    }

    /// @notice 设置稀有度概率
    /// @param _percentages uint8 数组，从 UR 到 N
    /// @dev 加一起必须是100，如果不要某个，将其概率设置为0
    function _setPercentage(uint8[] calldata _percentages) private {
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
            percentages[Rarity(i)] = _percentages[i];
        }
        emit PercentageChanged();
    }

    /// @notice 计算稀有度
    /// @param randomWords 给定随机数，数组
    /// @return rarity 随机数的稀有度，数组
    /// @dev 从后往前遍历（N->R->SR->SSR->UR），概率大的先判断
    function getRandomRarity(uint256[] calldata randomWords) private view returns (Rarity[] memory rarity) {
        uint256 length = randomWords.length;
        rarity = new Rarity[](length);
        for (uint i = 0; i < length; i++) {
            uint8 word = uint8((randomWords[i] % 100) + 1); // 1-100
            console.log("word:", word);
            uint8 cumulative = 0;
            for (uint8 j = 4; j >= 0; j--) {
                cumulative += percentages[Rarity(j)];
                console.log("cumulative:", cumulative);
                if (word <= cumulative) {
                    console.log("ready to set rarity");
                    rarity[i] = Rarity(j);
                    console.log("rarity:", uint(rarity[i]));
                    console.log("already set rarity");
                    break;
                }
            }
        }
    }
}
