import { expect } from "chai"
import { network } from "hardhat"

describe("RaritySingle Unit Tests", function () {
  it("Should successfully", async function () {
    const { ethers } = await network.connect()
    const rarity = await ethers.deployContract("RarityOnly")
    const words = [999088n]
    await rarity.fulfillRandomWords(123, words)
    const result = await rarity.getResult(123)
    expect(result[0]).equal(1) // numWords
    expect(result[1]).to.have.members(words); // words
    expect(result[2]).to.have.members([2n]) // rarity
  })
})
