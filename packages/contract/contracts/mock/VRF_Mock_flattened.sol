/// @notice This file flatten: chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol
/// @notice Edited VRFConsumerBaseV2Plus to VRFConsumerBaseV2PlusUpgradeable

// SPDX-License-Identifier: MIT

// File: @chainlink/contracts@1.5.0/src/v0.8/shared/interfaces/IOwnable.sol

pragma solidity ^0.8.0;

interface IOwnable {
  function owner() external returns (address);
  function transferOwnership(address recipient) external;
  function acceptOwnership() external;
}

// File: @chainlink/contracts@1.5.0/src/v0.8/shared/access/ConfirmedOwnerWithProposal.sol

pragma solidity ^0.8.0;

contract ConfirmedOwnerWithProposal is IOwnable {
  address private s_owner;
  address private s_pendingOwner;

  event OwnershipTransferRequested(address indexed from, address indexed to);
  event OwnershipTransferred(address indexed from, address indexed to);

  constructor(address newOwner, address pendingOwner) {
    // solhint-disable-next-line gas-custom-errors
    require(newOwner != address(0), "Cannot set owner to zero");

    s_owner = newOwner;
    if (pendingOwner != address(0)) {
      _transferOwnership(pendingOwner);
    }
  }

  function transferOwnership(address to) public override onlyOwner {
    _transferOwnership(to);
  }

  function acceptOwnership() external override {
    // solhint-disable-next-line gas-custom-errors
    require(msg.sender == s_pendingOwner, "Must be proposed owner");

    address oldOwner = s_owner;
    s_owner = msg.sender;
    s_pendingOwner = address(0);

    emit OwnershipTransferred(oldOwner, msg.sender);
  }

  function owner() public view override returns (address) {
    return s_owner;
  }

  function _transferOwnership(address to) private {
    // solhint-disable-next-line gas-custom-errors
    require(to != msg.sender, "Cannot transfer to self");
    s_pendingOwner = to;
    emit OwnershipTransferRequested(s_owner, to);
  }

  function _validateOwnership() internal view {
    // solhint-disable-next-line gas-custom-errors
    require(msg.sender == s_owner, "Only callable by owner");
  }

  modifier onlyOwner() {
    _validateOwnership();
    _;
  }
}

// File: @chainlink/contracts@1.5.0/src/v0.8/shared/access/ConfirmedOwner.sol

pragma solidity ^0.8.0;

contract ConfirmedOwner is ConfirmedOwnerWithProposal {
  constructor(address newOwner) ConfirmedOwnerWithProposal(newOwner, address(0)) {}
}

// File: @chainlink/contracts@1.5.0/src/v0.8/shared/interfaces/AggregatorV3Interface.sol

pragma solidity ^0.8.0;

// solhint-disable-next-line interface-starts-with-i
interface AggregatorV3Interface {
  function decimals() external view returns (uint8);
  function description() external view returns (string memory);
  function version() external view returns (uint256);
  function getRoundData(
    uint80 _roundId
  ) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);

  function latestRoundData()
    external
    view
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

// File: @chainlink/contracts@1.5.0/src/v0.8/shared/interfaces/IERC677Receiver.sol

pragma solidity ^0.8.6;

interface IERC677Receiver {
  function onTokenTransfer(address sender, uint256 amount, bytes calldata data) external;
}

// File: @chainlink/contracts@1.5.0/src/v0.8/shared/interfaces/LinkTokenInterface.sol

pragma solidity ^0.8.0;

// solhint-disable-next-line interface-starts-with-i
interface LinkTokenInterface {
  function allowance(address owner, address spender) external view returns (uint256 remaining);

  function approve(address spender, uint256 value) external returns (bool success);

  function balanceOf(address owner) external view returns (uint256 balance);

  function decimals() external view returns (uint8 decimalPlaces);

  function decreaseApproval(address spender, uint256 addedValue) external returns (bool success);

  function increaseApproval(address spender, uint256 subtractedValue) external;

  function name() external view returns (string memory tokenName);

  function symbol() external view returns (string memory tokenSymbol);

  function totalSupply() external view returns (uint256 totalTokensIssued);

  function transfer(address to, uint256 value) external returns (bool success);

  function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool success);

  function transferFrom(address from, address to, uint256 value) external returns (bool success);
}

// File: @chainlink/contracts@1.5.0/src/v0.8/vrf/dev/interfaces/IVRFSubscriptionV2Plus.sol

pragma solidity ^0.8.0;

interface IVRFSubscriptionV2Plus {
  /**
   * @notice Add a consumer to a VRF subscription.
   * @param subId - ID of the subscription
   * @param consumer - New consumer which can use the subscription
   */
  function addConsumer(uint256 subId, address consumer) external;

  /**
   * @notice Remove a consumer from a VRF subscription.
   * @param subId - ID of the subscription
   * @param consumer - Consumer to remove from the subscription
   */
  function removeConsumer(uint256 subId, address consumer) external;

  /**
   * @notice Cancel a subscription
   * @param subId - ID of the subscription
   * @param to - Where to send the remaining LINK to
   */
  function cancelSubscription(uint256 subId, address to) external;

  /**
   * @notice Accept subscription owner transfer.
   * @param subId - ID of the subscription
   * @dev will revert if original owner of subId has
   * not requested that msg.sender become the new owner.
   */
  function acceptSubscriptionOwnerTransfer(uint256 subId) external;

  /**
   * @notice Request subscription owner transfer.
   * @param subId - ID of the subscription
   * @param newOwner - proposed new owner of the subscription
   */
  function requestSubscriptionOwnerTransfer(uint256 subId, address newOwner) external;

  /**
   * @notice Create a VRF subscription.
   * @return subId - A unique subscription id.
   * @dev You can manage the consumer set dynamically with addConsumer/removeConsumer.
   * @dev Note to fund the subscription with LINK, use transferAndCall. For example
   * @dev  LINKTOKEN.transferAndCall(
   * @dev    address(COORDINATOR),
   * @dev    amount,
   * @dev    abi.encode(subId));
   * @dev Note to fund the subscription with Native, use fundSubscriptionWithNative. Be sure
   * @dev  to send Native with the call, for example:
   * @dev COORDINATOR.fundSubscriptionWithNative{value: amount}(subId);
   */
  function createSubscription() external returns (uint256 subId);

  /**
   * @notice Get a VRF subscription.
   * @param subId - ID of the subscription
   * @return balance - LINK balance of the subscription in juels.
   * @return nativeBalance - native balance of the subscription in wei.
   * @return reqCount - Requests count of subscription.
   * @return owner - owner of the subscription.
   * @return consumers - list of consumer address which are able to use this subscription.
   */
  function getSubscription(
    uint256 subId
  )
    external
    view
    returns (uint96 balance, uint96 nativeBalance, uint64 reqCount, address owner, address[] memory consumers);

  /**
   * @notice Check to see if there exists a request commitment consumers
   * for all consumers and keyhashes for a given sub.
   * @param subId - ID of the subscription
   * @return true if there exists at least one unfulfilled request for the subscription, false
   * otherwise.
   */
  function pendingRequestExists(uint256 subId) external view returns (bool);

  /**
   * @notice Paginate through all active VRF subscriptions.
   * @param startIndex index of the subscription to start from
   * @param maxCount maximum number of subscriptions to return, 0 to return all
   * @dev the order of IDs in the list is **not guaranteed**, therefore, if making successive calls, one
   * @dev should consider keeping the blockheight constant to ensure a holistic picture of the contract state
   */
  function getActiveSubscriptionIds(uint256 startIndex, uint256 maxCount) external view returns (uint256[] memory);

  /**
   * @notice Fund a subscription with native.
   * @param subId - ID of the subscription
   * @notice This method expects msg.value to be greater than or equal to 0.
   */
  function fundSubscriptionWithNative(uint256 subId) external payable;
}

// File: @openzeppelin/contracts@4.9.6/utils/structs/EnumerableSet.sol

// OpenZeppelin Contracts (last updated v4.9.0) (utils/structs/EnumerableSet.sol)
// This file was procedurally generated from scripts/generate/templates/EnumerableSet.js.

pragma solidity ^0.8.0;

library EnumerableSet {
  struct Set {
    bytes32[] _values;
    mapping(bytes32 => uint256) _indexes;
  }

  function _add(Set storage set, bytes32 value) private returns (bool) {
    if (!_contains(set, value)) {
      set._values.push(value);
      set._indexes[value] = set._values.length;
      return true;
    } else {
      return false;
    }
  }

  function _remove(Set storage set, bytes32 value) private returns (bool) {
    uint256 valueIndex = set._indexes[value];

    if (valueIndex != 0) {
      uint256 toDeleteIndex = valueIndex - 1;
      uint256 lastIndex = set._values.length - 1;
      if (lastIndex != toDeleteIndex) {
        bytes32 lastValue = set._values[lastIndex];
        set._values[toDeleteIndex] = lastValue;
        set._indexes[lastValue] = valueIndex; // Replace lastValue's index to valueIndex
      }

      set._values.pop();
      delete set._indexes[value];
      return true;
    } else {
      return false;
    }
  }

  function _contains(Set storage set, bytes32 value) private view returns (bool) {
    return set._indexes[value] != 0;
  }

  function _length(Set storage set) private view returns (uint256) {
    return set._values.length;
  }

  function _at(Set storage set, uint256 index) private view returns (bytes32) {
    return set._values[index];
  }

  function _values(Set storage set) private view returns (bytes32[] memory) {
    return set._values;
  }

  struct Bytes32Set {
    Set _inner;
  }

  function add(Bytes32Set storage set, bytes32 value) internal returns (bool) {
    return _add(set._inner, value);
  }

  function remove(Bytes32Set storage set, bytes32 value) internal returns (bool) {
    return _remove(set._inner, value);
  }

  function contains(Bytes32Set storage set, bytes32 value) internal view returns (bool) {
    return _contains(set._inner, value);
  }

  function length(Bytes32Set storage set) internal view returns (uint256) {
    return _length(set._inner);
  }

  function at(Bytes32Set storage set, uint256 index) internal view returns (bytes32) {
    return _at(set._inner, index);
  }

  function values(Bytes32Set storage set) internal view returns (bytes32[] memory) {
    bytes32[] memory store = _values(set._inner);
    bytes32[] memory result;

    /// @solidity memory-safe-assembly
    assembly {
      result := store
    }

    return result;
  }

  struct AddressSet {
    Set _inner;
  }

  function add(AddressSet storage set, address value) internal returns (bool) {
    return _add(set._inner, bytes32(uint256(uint160(value))));
  }

  function remove(AddressSet storage set, address value) internal returns (bool) {
    return _remove(set._inner, bytes32(uint256(uint160(value))));
  }

  function contains(AddressSet storage set, address value) internal view returns (bool) {
    return _contains(set._inner, bytes32(uint256(uint160(value))));
  }

  function length(AddressSet storage set) internal view returns (uint256) {
    return _length(set._inner);
  }

  function at(AddressSet storage set, uint256 index) internal view returns (address) {
    return address(uint160(uint256(_at(set._inner, index))));
  }

  function values(AddressSet storage set) internal view returns (address[] memory) {
    bytes32[] memory store = _values(set._inner);
    address[] memory result;

    /// @solidity memory-safe-assembly
    assembly {
      result := store
    }

    return result;
  }

  // UintSet

  struct UintSet {
    Set _inner;
  }

  function add(UintSet storage set, uint256 value) internal returns (bool) {
    return _add(set._inner, bytes32(value));
  }

  function remove(UintSet storage set, uint256 value) internal returns (bool) {
    return _remove(set._inner, bytes32(value));
  }

  function contains(UintSet storage set, uint256 value) internal view returns (bool) {
    return _contains(set._inner, bytes32(value));
  }

  function length(UintSet storage set) internal view returns (uint256) {
    return _length(set._inner);
  }

  function at(UintSet storage set, uint256 index) internal view returns (uint256) {
    return uint256(_at(set._inner, index));
  }

  function values(UintSet storage set) internal view returns (uint256[] memory) {
    bytes32[] memory store = _values(set._inner);
    uint256[] memory result;

    /// @solidity memory-safe-assembly
    assembly {
      result := store
    }

    return result;
  }
}

// File: @chainlink/contracts@1.5.0/src/v0.8/vrf/dev/SubscriptionAPI.sol

pragma solidity ^0.8.4;

abstract contract SubscriptionAPI is ConfirmedOwner, IERC677Receiver, IVRFSubscriptionV2Plus {
  using EnumerableSet for EnumerableSet.UintSet;

  LinkTokenInterface public LINK;
  AggregatorV3Interface public LINK_NATIVE_FEED;

  uint16 public constant MAX_CONSUMERS = 100;

  error TooManyConsumers();
  error InsufficientBalance();
  error InvalidConsumer(uint256 subId, address consumer);
  error InvalidSubscription();
  error OnlyCallableFromLink();
  error InvalidCalldata();
  error MustBeSubOwner(address owner);
  error PendingRequestExists();
  error MustBeRequestedOwner(address proposedOwner);
  error BalanceInvariantViolated(uint256 internalBalance, uint256 externalBalance); // Should never happen

  event FundsRecovered(address to, uint256 amount);
  event NativeFundsRecovered(address to, uint256 amount);

  error LinkAlreadySet();
  error FailedToSendNative();
  error FailedToTransferLink();
  error IndexOutOfRange();
  error LinkNotSet();

  struct Subscription {
    uint96 balance; // Common link balance used for all consumer requests.
    uint96 nativeBalance; // Common native balance used for all consumer requests.
    uint64 reqCount;
  }

  struct SubscriptionConfig {
    address owner; // Owner can fund/withdraw/cancel the sub.
    address requestedOwner; // For safely transferring sub ownership.
    address[] consumers;
  }

  struct ConsumerConfig {
    bool active;
    uint64 nonce;
    uint64 pendingReqCount;
  }

  mapping(address => mapping(uint256 => ConsumerConfig))
    /* consumerAddress */ /* subId */ /* consumerConfig */
    internal s_consumers;
  mapping(uint256 => SubscriptionConfig) /* subId */ /* subscriptionConfig */ internal s_subscriptionConfigs;
  mapping(uint256 => Subscription) /* subId */ /* subscription */ internal s_subscriptions;
  uint64 public s_currentSubNonce;
  EnumerableSet.UintSet internal s_subIds;
  uint96 public s_totalBalance;
  uint96 public s_totalNativeBalance;
  uint96 internal s_withdrawableTokens;
  uint96 internal s_withdrawableNative;

  event SubscriptionCreated(uint256 indexed subId, address owner);
  event SubscriptionFunded(uint256 indexed subId, uint256 oldBalance, uint256 newBalance);
  event SubscriptionFundedWithNative(uint256 indexed subId, uint256 oldNativeBalance, uint256 newNativeBalance);
  event SubscriptionConsumerAdded(uint256 indexed subId, address consumer);
  event SubscriptionConsumerRemoved(uint256 indexed subId, address consumer);
  event SubscriptionCanceled(uint256 indexed subId, address to, uint256 amountLink, uint256 amountNative);
  event SubscriptionOwnerTransferRequested(uint256 indexed subId, address from, address to);
  event SubscriptionOwnerTransferred(uint256 indexed subId, address from, address to);

  struct Config {
    uint16 minimumRequestConfirmations;
    uint32 maxGasLimit;
    // Reentrancy protection.
    bool reentrancyLock;
    uint32 stalenessSeconds;
    uint32 gasAfterPaymentCalculation;
    uint32 fulfillmentFlatFeeNativePPM;
    uint32 fulfillmentFlatFeeLinkDiscountPPM;
    uint8 nativePremiumPercentage;
    uint8 linkPremiumPercentage;
  }

  Config public s_config;

  error Reentrant();

  modifier nonReentrant() {
    _nonReentrant();
    _;
  }

  function _nonReentrant() internal view {
    if (s_config.reentrancyLock) {
      revert Reentrant();
    }
  }

  function _requireSufficientBalance(bool condition) internal pure {
    if (!condition) {
      revert InsufficientBalance();
    }
  }

  function _requireValidSubscription(address subOwner) internal pure {
    if (subOwner == address(0)) {
      revert InvalidSubscription();
    }
  }

  constructor() ConfirmedOwner(msg.sender) {}

  function setLINKAndLINKNativeFeed(address link, address linkNativeFeed) external onlyOwner {
    // Disallow re-setting link token because the logic wouldn't really make sense
    if (address(LINK) != address(0)) {
      revert LinkAlreadySet();
    }
    LINK = LinkTokenInterface(link);
    LINK_NATIVE_FEED = AggregatorV3Interface(linkNativeFeed);
  }

  function ownerCancelSubscription(uint256 subId) external onlyOwner {
    address subOwner = s_subscriptionConfigs[subId].owner;
    _requireValidSubscription(subOwner);
    _cancelSubscriptionHelper(subId, subOwner);
  }

  function recoverFunds(address to) external onlyOwner {
    if (address(LINK) == address(0)) {
      revert LinkNotSet();
    }

    uint256 externalBalance = LINK.balanceOf(address(this));
    uint256 internalBalance = uint256(s_totalBalance);
    if (internalBalance > externalBalance) {
      revert BalanceInvariantViolated(internalBalance, externalBalance);
    }
    if (internalBalance < externalBalance) {
      uint256 amount = externalBalance - internalBalance;
      if (!LINK.transfer(to, amount)) {
        revert FailedToTransferLink();
      }
      emit FundsRecovered(to, amount);
    }
    // If the balances are equal, nothing to be done.
  }

  function recoverNativeFunds(address payable to) external onlyOwner {
    uint256 externalBalance = address(this).balance;
    uint256 internalBalance = uint256(s_totalNativeBalance);
    if (internalBalance > externalBalance) {
      revert BalanceInvariantViolated(internalBalance, externalBalance);
    }
    if (internalBalance < externalBalance) {
      uint256 amount = externalBalance - internalBalance;
      (bool sent, ) = to.call{value: amount}("");
      if (!sent) {
        revert FailedToSendNative();
      }
      emit NativeFundsRecovered(to, amount);
    }
    // If the balances are equal, nothing to be done.
  }

  function withdraw(address recipient) external nonReentrant onlyOwner {
    if (address(LINK) == address(0)) {
      revert LinkNotSet();
    }
    uint96 amount = s_withdrawableTokens;
    _requireSufficientBalance(amount > 0);
    s_withdrawableTokens = 0;
    s_totalBalance -= amount;
    _requireSufficientBalance(LINK.transfer(recipient, amount));
  }

  function withdrawNative(address payable recipient) external nonReentrant onlyOwner {
    uint96 amount = s_withdrawableNative;
    _requireSufficientBalance(amount > 0);
    // Prevent re-entrancy by updating state before transfer.
    s_withdrawableNative = 0;
    s_totalNativeBalance -= amount;
    _mustSendNative(recipient, amount);
  }

  function onTokenTransfer(address, /* sender */ uint256 amount, bytes calldata data) external override nonReentrant {
    if (msg.sender != address(LINK)) {
      revert OnlyCallableFromLink();
    }
    if (data.length != 32) {
      revert InvalidCalldata();
    }
    uint256 subId = abi.decode(data, (uint256));
    _requireValidSubscription(s_subscriptionConfigs[subId].owner);
    // We do not check that the sender is the subscription owner,
    // anyone can fund a subscription.
    uint256 oldBalance = s_subscriptions[subId].balance;
    s_subscriptions[subId].balance += uint96(amount);
    s_totalBalance += uint96(amount);
    emit SubscriptionFunded(subId, oldBalance, oldBalance + amount);
  }

  function fundSubscriptionWithNative(uint256 subId) external payable override nonReentrant {
    _requireValidSubscription(s_subscriptionConfigs[subId].owner);
    uint256 oldNativeBalance = s_subscriptions[subId].nativeBalance;
    s_subscriptions[subId].nativeBalance += uint96(msg.value);
    s_totalNativeBalance += uint96(msg.value);
    emit SubscriptionFundedWithNative(subId, oldNativeBalance, oldNativeBalance + msg.value);
  }

  function getSubscription(
    uint256 subId
  )
    public
    view
    override
    returns (uint96 balance, uint96 nativeBalance, uint64 reqCount, address subOwner, address[] memory consumers)
  {
    subOwner = s_subscriptionConfigs[subId].owner;
    _requireValidSubscription(subOwner);
    return (
      s_subscriptions[subId].balance,
      s_subscriptions[subId].nativeBalance,
      s_subscriptions[subId].reqCount,
      subOwner,
      s_subscriptionConfigs[subId].consumers
    );
  }

  function getActiveSubscriptionIds(
    uint256 startIndex,
    uint256 maxCount
  ) external view override returns (uint256[] memory ids) {
    uint256 numSubs = s_subIds.length();
    if (startIndex >= numSubs) revert IndexOutOfRange();
    uint256 endIndex = startIndex + maxCount;
    endIndex = endIndex > numSubs || maxCount == 0 ? numSubs : endIndex;
    uint256 idsLength = endIndex - startIndex;
    ids = new uint256[](idsLength);
    for (uint256 idx = 0; idx < idsLength; ++idx) {
      ids[idx] = s_subIds.at(idx + startIndex);
    }
    return ids;
  }

  function createSubscription() external override nonReentrant returns (uint256 subId) {
    // Generate a subscription id that is globally unique.
    uint64 currentSubNonce = s_currentSubNonce;
    subId = uint256(
      keccak256(abi.encodePacked(msg.sender, blockhash(block.number - 1), address(this), currentSubNonce))
    );
    // Increment the subscription nonce counter.
    s_currentSubNonce = currentSubNonce + 1;
    // Initialize storage variables.
    address[] memory consumers = new address[](0);
    s_subscriptions[subId] = Subscription({balance: 0, nativeBalance: 0, reqCount: 0});
    s_subscriptionConfigs[subId] = SubscriptionConfig({
      owner: msg.sender,
      requestedOwner: address(0),
      consumers: consumers
    });
    // Update the s_subIds set, which tracks all subscription ids created in this contract.
    s_subIds.add(subId);

    emit SubscriptionCreated(subId, msg.sender);
    return subId;
  }

  function requestSubscriptionOwnerTransfer(
    uint256 subId,
    address newOwner
  ) external override onlySubOwner(subId) nonReentrant {
    // Proposing to address(0) would never be claimable so don't need to check.
    SubscriptionConfig storage subscriptionConfig = s_subscriptionConfigs[subId];
    if (subscriptionConfig.requestedOwner != newOwner) {
      subscriptionConfig.requestedOwner = newOwner;
      emit SubscriptionOwnerTransferRequested(subId, msg.sender, newOwner);
    }
  }

  function acceptSubscriptionOwnerTransfer(uint256 subId) external override nonReentrant {
    address oldOwner = s_subscriptionConfigs[subId].owner;
    _requireValidSubscription(oldOwner);
    if (s_subscriptionConfigs[subId].requestedOwner != msg.sender) {
      revert MustBeRequestedOwner(s_subscriptionConfigs[subId].requestedOwner);
    }
    s_subscriptionConfigs[subId].owner = msg.sender;
    s_subscriptionConfigs[subId].requestedOwner = address(0);
    emit SubscriptionOwnerTransferred(subId, oldOwner, msg.sender);
  }

  function addConsumer(uint256 subId, address consumer) external override onlySubOwner(subId) nonReentrant {
    ConsumerConfig storage consumerConfig = s_consumers[consumer][subId];
    if (consumerConfig.active) {
      // Idempotence - do nothing if already added.
      // Ensures uniqueness in s_subscriptions[subId].consumers.
      return;
    }
    // Already maxed, cannot add any more consumers.
    address[] storage consumers = s_subscriptionConfigs[subId].consumers;
    if (consumers.length == MAX_CONSUMERS) {
      revert TooManyConsumers();
    }
    // consumerConfig.nonce is 0 if the consumer had never sent a request to this subscription
    // otherwise, consumerConfig.nonce is non-zero
    // in both cases, use consumerConfig.nonce as is and set active status to true
    consumerConfig.active = true;
    consumers.push(consumer);

    emit SubscriptionConsumerAdded(subId, consumer);
  }

  function _deleteSubscription(uint256 subId) internal returns (uint96 balance, uint96 nativeBalance) {
    address[] storage consumers = s_subscriptionConfigs[subId].consumers;
    balance = s_subscriptions[subId].balance;
    nativeBalance = s_subscriptions[subId].nativeBalance;
    // Note bounded by MAX_CONSUMERS;
    // If no consumers, does nothing.
    uint256 consumersLength = consumers.length;
    for (uint256 i = 0; i < consumersLength; ++i) {
      delete s_consumers[consumers[i]][subId];
    }
    delete s_subscriptionConfigs[subId];
    delete s_subscriptions[subId];
    s_subIds.remove(subId);
    if (balance != 0) {
      s_totalBalance -= balance;
    }
    if (nativeBalance != 0) {
      s_totalNativeBalance -= nativeBalance;
    }
    return (balance, nativeBalance);
  }

  function _cancelSubscriptionHelper(uint256 subId, address to) internal {
    (uint96 balance, uint96 nativeBalance) = _deleteSubscription(subId);

    // Only withdraw LINK if the token is active and there is a balance.
    if (address(LINK) != address(0) && balance != 0) {
      _requireSufficientBalance(LINK.transfer(to, uint256(balance)));
    }

    // send native to the "to" address using call
    _mustSendNative(to, uint256(nativeBalance));
    emit SubscriptionCanceled(subId, to, balance, nativeBalance);
  }

  modifier onlySubOwner(uint256 subId) {
    _onlySubOwner(subId);
    _;
  }

  function _onlySubOwner(uint256 subId) internal view {
    address subOwner = s_subscriptionConfigs[subId].owner;
    _requireValidSubscription(subOwner);
    if (msg.sender != subOwner) {
      revert MustBeSubOwner(subOwner);
    }
  }

  function _mustSendNative(address to, uint256 amount) internal {
    (bool success, ) = to.call{value: amount}("");
    if (!success) {
      revert FailedToSendNative();
    }
  }
}

// File: @chainlink/contracts@1.5.0/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol

pragma solidity ^0.8.4;

// End consumer library.
library VRFV2PlusClient {
  // extraArgs will evolve to support new features
  bytes4 public constant EXTRA_ARGS_V1_TAG = bytes4(keccak256("VRF ExtraArgsV1"));

  struct ExtraArgsV1 {
    bool nativePayment;
  }

  struct RandomWordsRequest {
    bytes32 keyHash;
    uint256 subId;
    uint16 requestConfirmations;
    uint32 callbackGasLimit;
    uint32 numWords;
    bytes extraArgs;
  }

  function _argsToBytes(ExtraArgsV1 memory extraArgs) internal pure returns (bytes memory bts) {
    return abi.encodeWithSelector(EXTRA_ARGS_V1_TAG, extraArgs);
  }
}

// File: @chainlink/contracts@1.5.0/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol

pragma solidity ^0.8.0;

// Interface that enables consumers of VRFCoordinatorV2Plus to be future-proof for upgrades
// This interface is supported by subsequent versions of VRFCoordinatorV2Plus
interface IVRFCoordinatorV2Plus is IVRFSubscriptionV2Plus {
  function requestRandomWords(VRFV2PlusClient.RandomWordsRequest calldata req) external returns (uint256 requestId);
}

// File: @chainlink/contracts@1.5.0/src/v0.8/vrf/dev/interfaces/IVRFMigratableConsumerV2Plus.sol

pragma solidity ^0.8.0;

interface IVRFMigratableConsumerV2Plus {
  event CoordinatorSet(address vrfCoordinator);

  function setCoordinator(address vrfCoordinator) external;
}

// File: @chainlink/contracts@1.5.0/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol

pragma solidity ^0.8.4;

abstract contract VRFConsumerBaseV2Plus is IVRFMigratableConsumerV2Plus, ConfirmedOwner {
  error OnlyCoordinatorCanFulfill(address have, address want);
  error OnlyOwnerOrCoordinator(address have, address owner, address coordinator);
  error ZeroAddress();

  // s_vrfCoordinator should be used by consumers to make requests to vrfCoordinator
  // so that coordinator reference is updated after migration
  IVRFCoordinatorV2Plus public s_vrfCoordinator;

  /**
   * @param _vrfCoordinator address of VRFCoordinator contract
   */
  constructor(address _vrfCoordinator) ConfirmedOwner(msg.sender) {
    if (_vrfCoordinator == address(0)) {
      revert ZeroAddress();
    }
    s_vrfCoordinator = IVRFCoordinatorV2Plus(_vrfCoordinator);
  }

  function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal virtual;

  // rawFulfillRandomness is called by VRFCoordinator when it receives a valid VRF
  // proof. rawFulfillRandomness then calls fulfillRandomness, after validating
  // the origin of the call
  function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
    if (msg.sender != address(s_vrfCoordinator)) {
      revert OnlyCoordinatorCanFulfill(msg.sender, address(s_vrfCoordinator));
    }
    fulfillRandomWords(requestId, randomWords);
  }

  /**
   * @inheritdoc IVRFMigratableConsumerV2Plus
   */
  function setCoordinator(address _vrfCoordinator) external override onlyOwnerOrCoordinator {
    if (_vrfCoordinator == address(0)) {
      revert ZeroAddress();
    }
    s_vrfCoordinator = IVRFCoordinatorV2Plus(_vrfCoordinator);

    emit CoordinatorSet(_vrfCoordinator);
  }

  modifier onlyOwnerOrCoordinator() {
    if (msg.sender != owner() && msg.sender != address(s_vrfCoordinator)) {
      revert OnlyOwnerOrCoordinator(msg.sender, owner(), address(s_vrfCoordinator));
    }
    _;
  }
}


// File: OpenZeppelin Contracts (last updated v5.3.0) (proxy/utils/Initializable.sol)

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// File: VRFConsumerBaseV2PlusUpgradeable.sol

abstract contract VRFConsumerBaseV2PlusUpgradeable is Initializable {
    error OnlyCoordinatorCanFulfill(address have, address want);
    address private vrfCoordinator;

    function __VRFConsumerBaseV2Upgradeable_init(address _vrfCoordinator) internal onlyInitializing {
        vrfCoordinator = _vrfCoordinator;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal virtual;

    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        if (msg.sender != vrfCoordinator) {
            revert OnlyCoordinatorCanFulfill(msg.sender, vrfCoordinator);
        }
        fulfillRandomWords(requestId, randomWords);
    }

}


// File: @chainlink/contracts@1.5.0/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol

// A mock for testing code that relies on VRFCoordinatorV2_5.
pragma solidity ^0.8.19;

// solhint-disable-next-line no-unused-import

contract VRFCoordinatorV2_5Mock is SubscriptionAPI, IVRFCoordinatorV2Plus {
  uint96 public immutable i_base_fee;
  uint96 public immutable i_gas_price;
  int256 public immutable i_wei_per_unit_link;

  error InvalidRequest();
  error InvalidRandomWords();
  error InvalidExtraArgsTag();
  error NotImplemented();

  event RandomWordsRequested(
    bytes32 indexed keyHash,
    uint256 requestId,
    uint256 preSeed,
    uint256 indexed subId,
    uint16 minimumRequestConfirmations,
    uint32 callbackGasLimit,
    uint32 numWords,
    bytes extraArgs,
    address indexed sender
  );
  event RandomWordsFulfilled(
    uint256 indexed requestId,
    uint256 outputSeed,
    uint256 indexed subId,
    uint96 payment,
    bool nativePayment,
    bool success,
    bool onlyPremium
  );
  event ConfigSet();

  uint64 internal s_currentSubId;
  uint256 internal s_nextRequestId = 1;
  uint256 internal s_nextPreSeed = 100;

  struct Request {
    uint256 subId;
    uint32 callbackGasLimit;
    uint32 numWords;
    bytes extraArgs;
  }

  mapping(uint256 => Request) internal s_requests; /* requestId */ /* request */

  constructor(uint96 _baseFee, uint96 _gasPrice, int256 _weiPerUnitLink) SubscriptionAPI() {
    i_base_fee = _baseFee;
    i_gas_price = _gasPrice;
    i_wei_per_unit_link = _weiPerUnitLink;
    setConfig();
  }

  /**
   * @notice Sets the configuration of the vrfv2 mock coordinator
   */
  function setConfig() public onlyOwner {
    s_config = Config({
      minimumRequestConfirmations: 0,
      maxGasLimit: 0,
      stalenessSeconds: 0,
      gasAfterPaymentCalculation: 0,
      reentrancyLock: false,
      fulfillmentFlatFeeNativePPM: 0,
      fulfillmentFlatFeeLinkDiscountPPM: 0,
      nativePremiumPercentage: 0,
      linkPremiumPercentage: 0
    });
    emit ConfigSet();
  }

  function consumerIsAdded(uint256 _subId, address _consumer) public view returns (bool) {
    return s_consumers[_consumer][_subId].active;
  }

  modifier onlyValidConsumer(uint256 _subId, address _consumer) {
    if (!consumerIsAdded(_subId, _consumer)) {
      revert InvalidConsumer(_subId, _consumer);
    }
    _;
  }

  /**
   * @notice fulfillRandomWords fulfills the given request, sending the random words to the supplied
   * @notice consumer.
   *
   * @dev This mock uses a simplified formula for calculating payment amount and gas usage, and does
   * @dev not account for all edge cases handled in the real VRF coordinator. When making requests
   * @dev against the real coordinator a small amount of additional LINK is required.
   *
   * @param _requestId the request to fulfill
   * @param _consumer the VRF randomness consumer to send the result to
   */
  function fulfillRandomWords(uint256 _requestId, address _consumer) external nonReentrant {
    fulfillRandomWordsWithOverride(_requestId, _consumer, new uint256[](0));
  }

  /**
   * @notice fulfillRandomWordsWithOverride allows the user to pass in their own random words.
   *
   * @param _requestId the request to fulfill
   * @param _consumer the VRF randomness consumer to send the result to
   * @param _words user-provided random words
   */
  function fulfillRandomWordsWithOverride(uint256 _requestId, address _consumer, uint256[] memory _words) public {
    uint256 startGas = gasleft();
    if (s_requests[_requestId].subId == 0) {
      revert InvalidRequest();
    }
    Request memory req = s_requests[_requestId];

    if (_words.length == 0) {
      _words = new uint256[](req.numWords);
      for (uint256 i = 0; i < req.numWords; i++) {
        _words[i] = uint256(keccak256(abi.encode(_requestId, i)));
      }
    } else if (_words.length != req.numWords) {
      revert InvalidRandomWords();
    }

    VRFConsumerBaseV2PlusUpgradeable v;
    bytes memory callReq = abi.encodeWithSelector(v.rawFulfillRandomWords.selector, _requestId, _words);
    s_config.reentrancyLock = true;
    // solhint-disable-next-line avoid-low-level-calls, no-unused-vars
    (bool success, ) = _consumer.call{gas: req.callbackGasLimit}(callReq);
    s_config.reentrancyLock = false;

    bool nativePayment = uint8(req.extraArgs[req.extraArgs.length - 1]) == 1;

    uint256 rawPayment = i_base_fee + ((startGas - gasleft()) * i_gas_price);
    if (!nativePayment) {
      rawPayment = (1e18 * rawPayment) / uint256(i_wei_per_unit_link);
    }
    uint96 payment = uint96(rawPayment);

    _chargePayment(payment, nativePayment, req.subId);

    delete (s_requests[_requestId]);
    emit RandomWordsFulfilled(_requestId, _requestId, req.subId, payment, nativePayment, success, false);
  }

  function _chargePayment(uint96 payment, bool nativePayment, uint256 subId) internal {
    Subscription storage subcription = s_subscriptions[subId];
    if (nativePayment) {
      uint96 prevBal = subcription.nativeBalance;
      if (prevBal < payment) {
        revert InsufficientBalance();
      }
      subcription.nativeBalance = prevBal - payment;
      s_withdrawableNative += payment;
    } else {
      uint96 prevBal = subcription.balance;
      if (prevBal < payment) {
        revert InsufficientBalance();
      }
      subcription.balance = prevBal - payment;
      s_withdrawableTokens += payment;
    }
  }

  /**
   * @notice fundSubscription allows funding a subscription with an arbitrary amount for testing.
   *
   * @param _subId the subscription to fund
   * @param _amount the amount to fund
   */
  function fundSubscription(uint256 _subId, uint256 _amount) public {
    if (s_subscriptionConfigs[_subId].owner == address(0)) {
      revert InvalidSubscription();
    }
    uint256 oldBalance = s_subscriptions[_subId].balance;
    s_subscriptions[_subId].balance += uint96(_amount);
    s_totalBalance += uint96(_amount);
    emit SubscriptionFunded(_subId, oldBalance, oldBalance + _amount);
  }

  /// @dev Convert the extra args bytes into a struct
  /// @param extraArgs The extra args bytes
  /// @return The extra args struct
  function _fromBytes(bytes calldata extraArgs) internal pure returns (VRFV2PlusClient.ExtraArgsV1 memory) {
    if (extraArgs.length == 0) {
      return VRFV2PlusClient.ExtraArgsV1({nativePayment: false});
    }
    if (bytes4(extraArgs) != VRFV2PlusClient.EXTRA_ARGS_V1_TAG) revert InvalidExtraArgsTag();
    return abi.decode(extraArgs[4:], (VRFV2PlusClient.ExtraArgsV1));
  }

  function requestRandomWords(
    VRFV2PlusClient.RandomWordsRequest calldata _req
  ) external override nonReentrant onlyValidConsumer(_req.subId, msg.sender) returns (uint256) {
    uint256 subId = _req.subId;
    if (s_subscriptionConfigs[subId].owner == address(0)) {
      revert InvalidSubscription();
    }

    uint256 requestId = s_nextRequestId++;
    uint256 preSeed = s_nextPreSeed++;

    bytes memory extraArgsBytes = VRFV2PlusClient._argsToBytes(_fromBytes(_req.extraArgs));
    s_requests[requestId] = Request({
      subId: _req.subId,
      callbackGasLimit: _req.callbackGasLimit,
      numWords: _req.numWords,
      extraArgs: _req.extraArgs
    });

    emit RandomWordsRequested(
      _req.keyHash,
      requestId,
      preSeed,
      _req.subId,
      _req.requestConfirmations,
      _req.callbackGasLimit,
      _req.numWords,
      extraArgsBytes,
      msg.sender
    );
    return requestId;
  }

  function removeConsumer(
    uint256 _subId,
    address _consumer
  ) external override onlySubOwner(_subId) onlyValidConsumer(_subId, _consumer) nonReentrant {
    if (!s_consumers[_consumer][_subId].active) {
      revert InvalidConsumer(_subId, _consumer);
    }
    address[] memory consumers = s_subscriptionConfigs[_subId].consumers;
    uint256 lastConsumerIndex = consumers.length - 1;
    for (uint256 i = 0; i < consumers.length; ++i) {
      if (consumers[i] == _consumer) {
        address last = consumers[lastConsumerIndex];
        s_subscriptionConfigs[_subId].consumers[i] = last;
        s_subscriptionConfigs[_subId].consumers.pop();
        break;
      }
    }
    s_consumers[_consumer][_subId].active = false;
    emit SubscriptionConsumerRemoved(_subId, _consumer);
  }

  function cancelSubscription(uint256 _subId, address _to) external override onlySubOwner(_subId) nonReentrant {
    (uint96 balance, uint96 nativeBalance) = _deleteSubscription(_subId);

    (bool success, ) = _to.call{value: uint256(nativeBalance)}("");
    if (!success) {
      revert FailedToSendNative();
    }
    emit SubscriptionCanceled(_subId, _to, balance, nativeBalance);
  }

  function pendingRequestExists(uint256 /*subId*/) public pure override returns (bool) {
    revert NotImplemented();
  }
}
