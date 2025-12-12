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
        uint8[] rarity;
    }

    using EnumerableSetLib for EnumerableSetLib.Uint256Set;
    using EnumerableSetLib for EnumerableSetLib.AddressSet;

    // * 【 状态变量 】
    // ** 访问控制相关
    bytes32 private constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ** VRF 相关
    uint256 subId; // subscriptionId
    bytes32 keyHash;
    uint32 constant CALLBACK_GAS_LIMIT = 100_000;
    uint16 constant REQUEST_CONFIRMATIONS = 1;
    IVRFCoordinatorV2Plus COORDINATOR; // VRF coordinator

    // ** Gacha 相关
    mapping(Rarity => uint8) public percentages; // 稀有度概率
    mapping(uint256 reqId => address roller) reqToAddress; // 抽卡的地址
    mapping(address roller => uint256[] requests) addressToReq; // 地址的抽卡记录
    mapping(uint256 reqId => RandomResult) requests; // 所有结果记录
    EnumerableSetLib.Uint256Set processRequests; // 正在进行的 Request，reqId 集合
    EnumerableSetLib.Uint256Set doneRequests; // 已经完成的 Request，reqId 集合
    EnumerableSetLib.AddressSet allPlayers; // 所有玩过的玩家，地址集合

    // * 【 自定义错误 】
    error InvalidRarityPercentage();

    // TODO 特权地址

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        // 防止攻击者绕过代理直接调用实现合约的初始化
        _disableInitializers();
    }

    function initialize(
        uint256 _subId,
        address _vrfCoordinator,
        bytes32 _keyHash,
        address _admin,
        uint8[] memory _percentages
    ) public initializer {
        // * 访问控制
        __Pausable_init();
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
        // * VRF
        subId = _subId;
        keyHash = _keyHash;
        __VRFConsumerBaseV2Upgradeable_init(_vrfCoordinator);
        COORDINATOR = IVRFCoordinatorV2Plus(_vrfCoordinator);

        // TODO 分配概率
        if (_percentages.length != 5) {
            // TODO 检查概率加一起等于 100
            revert InvalidRarityPercentage();
        }
    }

    /// 分配稀有度
    // function getRandomRarity() internal returns (Rarity) {
    /// @dev 避免比较次数过多，应该让概率最大的比较次数最少
    // }

    /// 单抽
    // TODO
    // function gachaOne() returns () {}

    /// 十连
    // TODO
    // function gachaTen() returns () {}

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    event RandomFulfilled(uint256[] randomWords);

    function requestRandomWords() external {
        /// @dev Will revert if subscription is not set and funded.
        //     s_requestId = s_vrfCoordinator.requestRandomWords(
        //         VRFV2PlusClient.RandomWordsRequest({
        //             keyHash: s_keyHash,
        //             subId: s_subscriptionId,
        //             requestConfirmations: REQUEST_CONFIRMATIONS,
        //             callbackGasLimit: CALLBACK_GAS_LIMIT,
        //             numWords: NUM_WORDS,
        //             extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
        //         })
        //     );
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        // s_randomWords = randomWords;
        // emit ReturnedRandomness(randomWords);
    }
}
