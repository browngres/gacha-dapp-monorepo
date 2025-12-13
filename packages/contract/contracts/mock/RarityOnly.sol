// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "hardhat/console.sol";

/// @notice "用来单独测试 稀有度计算 涉及存储的问题"
contract RarityOnly {
    enum Rarity {
        UR,
        SSR,
        SR,
        R,
        N
    }

    struct RandomResult {
        uint8 numWords;
        uint256[] words;
        Rarity[] rarity;
    }
    mapping(Rarity => uint8) public percentages; // 稀有度概率
    mapping(uint256 reqId => RandomResult) public requests; // 所有结果记录

    constructor() {
        percentages[Rarity.UR] = 2;
        percentages[Rarity.SSR] = 8;
        percentages[Rarity.SR] = 10;
        percentages[Rarity.R] = 20;
        percentages[Rarity.N] = 60;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) public {
        console.log("now in fulfillRandomWords");
        console.log("requestId to fulfill:", requestId);
        RandomResult memory result;
        result.numWords = uint8(randomWords.length);
        result.words = randomWords;

        // 计算 rarity
        console.log("now goto getRandomRarity");
        result.rarity = getRandomRarity(randomWords);
        requests[requestId] = result;
        console.log("now ready to emit");
        // emit RandomFulfilled(requestId, randomWords);
    }

    function getRandomRarity(uint256[] memory randomWords) public view returns (Rarity[] memory rarity) {
        uint256 length = randomWords.length;
        console.log("now here");
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
                    // console.log("now here");
                    break;
                }
            }
        }
    }

    function getResult(uint256 reqId) public view returns (uint8, uint256[] memory, Rarity[] memory) {
        RandomResult storage result = requests[reqId];
        return (result.numWords, result.words, result.rarity);
    }
}
