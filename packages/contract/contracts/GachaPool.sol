// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// 访问控制
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

// VRF
import {VRFConsumerBaseV2Plus} from "./mock/VRF_Mock_flattened.sol";
import {VRFV2PlusClient} from "./mock/VRF_Mock_flattened.sol";

/*
备忘： whenNotPaused, whenPaused, nonReentrant
*/

contract GachaPool is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    VRFConsumerBaseV2Plus
{
    // 类型声明

    // 状态变量
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
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
