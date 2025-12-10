// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// 参考链接 https://docs.chain.link/vrf/v2-5/subscription/test-locally

// import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
// import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {VRFConsumerBaseV2Plus} from "./mock/VRF_Mock_flattened.sol";
import {VRFV2PlusClient} from "./mock/VRF_Mock_flattened.sol";


contract RandomConsumer is VRFConsumerBaseV2Plus {
  uint256 immutable s_subscriptionId;
  bytes32 immutable s_keyHash;
  uint32 constant CALLBACK_GAS_LIMIT = 100_000;
  uint16 constant REQUEST_CONFIRMATIONS = 1;
  uint32 constant NUM_WORDS = 2;

  uint256[] public s_randomWords;
  uint256 public s_requestId;

  event ReturnedRandomness(uint256[] randomWords);

  constructor(uint256 subscriptionId, address vrfCoordinator, bytes32 keyHash) VRFConsumerBaseV2Plus(vrfCoordinator) {
    s_keyHash = keyHash;
    s_subscriptionId = subscriptionId;
  }

  /**
   * @notice Requests randomness
   * Assumes the subscription is funded sufficiently; "Words" refers to unit of data in Computer Science
   */
  function requestRandomWords() external onlyOwner {
    // Will revert if subscription is not set and funded.
    s_requestId = s_vrfCoordinator.requestRandomWords(
      VRFV2PlusClient.RandomWordsRequest({
        keyHash: s_keyHash,
        subId: s_subscriptionId,
        requestConfirmations: REQUEST_CONFIRMATIONS,
        callbackGasLimit: CALLBACK_GAS_LIMIT,
        numWords: NUM_WORDS,
        extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
      })
    );
  }

  /**
   * @notice Callback function used by VRF Coordinator
   *
   * @param  - id of the request
   * @param randomWords - array of random results from VRF Coordinator
   */
  function fulfillRandomWords(
    uint256,
    /* requestId */
    uint256[] calldata randomWords
  ) internal override {
    s_randomWords = randomWords;
    emit ReturnedRandomness(randomWords);
  }
}
