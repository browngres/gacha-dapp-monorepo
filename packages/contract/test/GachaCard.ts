import { expect } from "chai"
import { network } from "hardhat"
import GachaCardModule from "../ignition/modules/GachaCardNFT.js"
import type { GachaCardNFT } from "../types/ethers-contracts/contracts/GachaCardNFT.sol/index.js"
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types"

// 生产环境是使用 GachaPool 合约来部署 GachaCardNFT
describe("GachaCard Unit Tests", function () {
  let nft: GachaCardNFT
  let user1: HardhatEthersSigner, user2: HardhatEthersSigner
  beforeEach(async function () {
    // 每次提前部署
    const { ethers, ignition } = await network.connect()
    const signers = await ethers.getSigners()
    user1 = signers[1]
    user2 = signers[2]
    const { GachaCard } = await ignition.deploy(GachaCardModule)
    nft = await ethers.getContractAt("GachaCardNFT", GachaCard.target)
  })

  it("Should successfully initialized with given config", async function () {
    expect(await nft.name()).to.equal("Gacha Card")
    expect(await nft.symbol()).to.equal("GC")
    expect(await nft.contractURI()).to.equal("http://127.0.0.1/nft/contract-metadata.json")
    // baseURI 是 internal，不能直接调用，后面通过 tokenURI 检查
  })

  it("Should successfully setBaseURI", async function () {
    const newURI = "https://example.com/nft/"
    await nft.setBaseURI(newURI)
    // 通过 mint 一个 token 来检查 tokenURI
    await nft.mintWithRarity(user1.address, 1)
    expect(await nft.tokenURI(0)).to.equal(newURI + "0")

    // onlyOwner
    await expect(nft.connect(user1).setBaseURI("newURI")).to.be.revertedWithCustomError(nft, "Unauthorized")
  })

  it("Should successfully setContractURI", async function () {
    const newURI = "https://example.com/contract.json"
    await nft.setContractURI(newURI)
    expect(await nft.contractURI()).to.equal(newURI)

    // 非 owner 不能设置
    await expect(nft.connect(user1).setContractURI("newURI")).to.be.revertedWithCustomError(nft, "Unauthorized")
  })

  it("Mint", async function () {
    // Mint 第一个 token
    await nft.mintWithRarity(user1.address, 0)
    expect(await nft.ownerOf(0)).to.equal(user1.address)
    expect(await nft.getRarity(0)).to.equal(0)
    expect(await nft.tokenURI(0)).to.equal("http://127.0.0.1/nft/0")

    // Mint 第二个 token
    await nft.mintWithRarity(user2.address, 3)
    expect(await nft.ownerOf(1)).to.equal(user2.address)
    expect(await nft.getRarity(1)).to.equal(3)
    expect(await nft.tokenURI(1)).to.equal("http://127.0.0.1/nft/1")

    // 非 owner 不能 mint
    await expect(nft.connect(user1).mintWithRarity(user1.address, 1)).to.be.revertedWithCustomError(nft, "Unauthorized")
  })

  it("Transfer", async function () {
    // Mint 一个 token 给 user1
    await nft.mintWithRarity(user1.address, 2)
    expect(await nft.ownerOf(0)).to.equal(user1.address)

    // user1 转移给 user2
    await nft.connect(user1).transferFrom(user1.address, user2.address, 0)
    expect(await nft.ownerOf(0)).to.equal(user2.address)
    expect(await nft.getRarity(0)).to.equal(2) // 稀有度不变

    // 非 token owner 不能转移，合约 owner 也不行
    await expect(nft.transferFrom(user2.address, user1.address, 0)).to.be.revertedWithCustomError(
      nft,
      "NotOwnerNorApproved",
    )
  })
})
