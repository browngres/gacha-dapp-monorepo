import { expect } from "chai"
import { network } from "hardhat"
import type { HardhatEthers, HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types"
import { getBytes, parseEther, solidityPackedKeccak256, type BytesLike, type EventLog } from "ethers"
import gachaPoolModule from "../ignition/modules/GachaPool.js"
import type { GachaCardNFT, GachaPool, VRFCoordinatorV2_5Mock } from "../types/ethers-contracts/index.js"

describe("GachaPool Claim Unit Tests", function () {
  let gachaPool: GachaPool
  let vrf: VRFCoordinatorV2_5Mock
  let nft: GachaCardNFT
  let deployer: HardhatEthersSigner
  let hh_ethers: HardhatEthers
  let signature: BytesLike

  const badSignature = ("0x00" + "0123456789abcdef".repeat(8)) as BytesLike // 带 "0x" 是 132 位

  before("Make signature", async function () {
    const { ethers } = await network.connect()
    // 每次正确的签名是相同的
    deployer = (await ethers.getSigners())[0]
    // another = (await ethers.getSigners())[1]
    signature = await deployer.signMessage(
      getBytes(
        solidityPackedKeccak256(
          ["uint256", "address", "address"],
          [1n, "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"],
        ),
      ),
    )
    // console.log("signature", signature)
  })

  beforeEach("Deploy GachaPool", async function () {
    const { ethers, ignition } = await network.connect()
    hh_ethers = ethers
    const { proxy: _gacha } = await ignition.deploy(gachaPoolModule)
    gachaPool = await ethers.getContractAt("GachaPool", _gacha.target)
    const _vrf = await gachaPool.getAddressVRF()
    vrf = await ethers.getContractAt("VRFCoordinatorV2_5Mock", _vrf)
    const _nft = await gachaPool.GACHA_CARD_NFT()
    nft = await ethers.getContractAt("GachaCardNFT", _nft)
  })

  it("Should successfully claim gachaOne", async function () {
    const tx = await gachaPool.gachaOne({ value: parseEther("0.1") })
    const txReceipt = await tx.wait()
    const gachaEvent = txReceipt?.logs[2] as EventLog
    const reqId = gachaEvent.args[1] // 一定是 1
    await vrf.fulfillRandomWordsWithOverride(reqId, gachaPool.target, [66n])
    // 检查签名长度
    expect(signature).to.have.lengthOf(132)
    // 领取
    await expect(gachaPool.claim(reqId, signature)).to.emit(gachaPool, "NftMinted")
    // 检查 NFT 稀有度
    expect(await nft.getRarity(0)).to.equal(3)
  })

  it("Should successfully claim gachaTen", async function () {
    const tx = await gachaPool.gachaTen({ value: parseEther("0.9") })
    const txReceipt = await tx.wait()
    const gachaEvent = txReceipt?.logs[2] as EventLog
    const reqId = gachaEvent.args[1] // 一定是 1
    await vrf.fulfillRandomWordsWithOverride(
      reqId,
      gachaPool.target,
      // prettier-ignore
      [0n, 11n, 22n, 33n, 44n, 55n, 66n, 77n, 88n, 99n],
    )

    await expect(gachaPool.claim(reqId, signature)).to.emit(gachaPool, "NftMinted")
    expect(await nft.getRarity(0)).to.equal(4)
    expect(await nft.getRarity(1)).to.equal(4)
    expect(await nft.getRarity(2)).to.equal(4)
    expect(await nft.getRarity(3)).to.equal(4)
    expect(await nft.getRarity(4)).to.equal(4)
    expect(await nft.getRarity(5)).to.equal(4)
    expect(await nft.getRarity(6)).to.equal(3)
    expect(await nft.getRarity(7)).to.equal(3)
    expect(await nft.getRarity(8)).to.equal(2)
    expect(await nft.getRarity(9)).to.equal(0)
  })

  it("Should fulfill random before claim", async function () {
    await gachaPool.gachaOne({ value: parseEther("0.1") })
    // 还没有 fulfill 就 claim
    await expect(gachaPool.claim(1n, signature))
      .to.be.revertedWithCustomError(gachaPool, "ReqIdInvalid")
      .withArgs(false)
  })

  describe("Invalid Claim", function () {
    beforeEach("Gacha and fulfill before claim", async function () {
      await gachaPool.gachaOne({ value: parseEther("0.1") })
      await vrf.fulfillRandomWordsWithOverride(1n, gachaPool.target, [88n])
    })

    it("Invalid Signature", async function () {
      // 签名为空
      await expect(gachaPool.claim(1n, "0x")).to.be.revertedWithCustomError(gachaPool, "InvalidSignature")
      // 无效签名
      await expect(gachaPool.claim(1n, badSignature)).to.be.revertedWithCustomError(gachaPool, "InvalidSignature")
    })

    it("Invalid ReqId", async function () {
      // 错误 reqId
      await expect(gachaPool.claim(2n, badSignature)).to.be.revertedWithCustomError(gachaPool, "ReqIdInvalid")
    })

    it("Claim Twice", async function () {
      await gachaPool.claim(1n, signature)
      // 重复领取
      await expect(gachaPool.claim(1n, signature))
        .to.be.revertedWithCustomError(gachaPool, "ReqIdInvalid")
        .withArgs(true)
    })

    it("Only claim one's own", async function () {
      const another = (await hh_ethers.getSigners())[4]
      // 只有自己能领
      await expect(gachaPool.connect(another).claim(1n, signature)).to.be.revertedWithCustomError(
        gachaPool,
        "InvalidSignature",
      )
    })
  })
})
