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
import {EnumerableSetLib} from "./solady/src/utils/EnumerableSetLib.sol";

/*
备忘： whenNotPaused, whenPaused, nonReentrant
*/

contract GachaPool is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    VRFConsumerBaseV2Plus
{
    // * 类型声明
    /// @dev 稀有度
    enum Rarity {
        UR,
        SSR,
        SR,
        R,
        N
    }
    struct RandomResults {
        uint8 numWords;
        uint256[] words;
        uint8[] rarity;
    }

    using EnumerableSet for EnumerableSet.UintSet;

    // * 状态变量
    // ** 访问控制相关
    bytes32 private constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    // ** VRF 相关
    uint256 immutable subId;
    bytes32 immutable keyHash;
    uint32 constant CALLBACK_GAS_LIMIT = 100_000;
    uint16 constant REQUEST_CONFIRMATIONS = 1;

    // TODO 特权地址


    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _admin) public initializer {
        // 访问控制
        __Pausable_init();
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(PAUSER_ROLE, _admin);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
