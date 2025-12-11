// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// 访问控制
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

// Chainlink VRF
/// @notice 这是开发环境的 Mock 合约，生产环境需更换导入路径
import {VRFConsumerBaseV2Plus} from "./mock/VRF_Mock_flattened.sol";
import {VRFV2PlusClient} from "./mock/VRF_Mock_flattened.sol";

// 枚举类型
import {EnumerableSetLib} from "solady/src/utils/EnumerableSetLib.sol";

/*
备忘： whenNotPaused, whenPaused, nonReentrant
*/

contract GachaPool is Initializable, PausableUpgradeable, AccessControlUpgradeable, VRFConsumerBaseV2Plus {
    // * 类型声明
    /// @dev 稀有度
    enum Rarity {
        UR,
        SSR,
        SR,
        R,
        N
    }
    /// @dev 一个请求是否被 fulfilled 使用集合来查找，这里不存
    struct RandomResult {
        uint8 numWords;
        uint256[] words;
        uint8[] rarity;
    }

    using EnumerableSetLib for EnumerableSetLib.Uint256Set;
    using EnumerableSetLib for EnumerableSetLib.AddressSet;

    // * 状态变量
    // ** 访问控制相关
    bytes32 private constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ** VRF 相关
    uint256 immutable subId; // subscriptionId
    bytes32 immutable keyHash;
    uint32 constant CALLBACK_GAS_LIMIT = 100_000;
    uint16 constant REQUEST_CONFIRMATIONS = 1;

    // ** Gacha 相关
    mapping(Rarity => uint8) public percentages; // 稀有度概率
    mapping(uint256 reqId => address roller) reqToAddress; // 抽卡的地址
    mapping(address roller => uint256[] requests) addressToReq; // 地址的抽卡记录
    mapping(uint256 reqId => RandomResult) requests; // 所有结果记录
    EnumerableSet.Uint256Set processRequests; // 正在进行的 Request，reqId 集合
    EnumerableSet.Uint256Set doneRequests; // 已经完成的 Request，reqId 集合
    EnumerableSet.AddressSet allPlayers; // 所有玩过的玩家，地址集合

    // * 自定义错误
    error InvalidRarityPercentage();

    // TODO 特权地址

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        uint256 _subId,
        address vrfCoordinator,
        bytes32 _keyHash,
        address _admin,
        uint8[] memory _percentages
    ) public VRFConsumerBaseV2Plus(vrfCoordinator) initializer {
        // * 访问控制
        __Pausable_init();
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
        // * VRF
        subId = _subId;
        keyHash = _keyHash;
        // TODO 分配概率
        if (_percentages.length != 5) {
            revert InvalidRarityPercentage;
        }
    }

    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
