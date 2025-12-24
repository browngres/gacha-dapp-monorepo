// import { expect } from "chai"
import { describe, expect, test } from "bun:test"
import { network } from "hardhat"

describe("RarityOnly Unit Tests", function () {
  test("Should successfully", async function () {
    const { ethers } = await network.connect()
    const rarity = await ethers.deployContract("RarityOnly")
    const words = [999088n]
    await rarity.fulfillRandomWords(123, words)
    const result = await rarity.getResult(123)
    expect(result[0]).toEqual(1n) // numWords
    expect(result[1]).toEqual(words) // words
    expect(result[2]).toEqual([2n]) // rarity
  })
})
