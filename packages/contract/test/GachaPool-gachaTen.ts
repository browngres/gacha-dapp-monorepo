import { expect } from "chai"
import { network } from "hardhat"
import gachaPoolModule from "../ignition/modules/GachaPool.js"
import { randomBytes } from "crypto"
import type { GachaPool, VRFCoordinatorV2_5Mock } from "../types/ethers-contracts/index.js"
import { parseEther } from "ethers"

// 测试十连抽卡流程，只测试十连相关，和单抽重复的就内容不测试
describe("GachaPool GachaTen Unit Tests", function () {
  let gachaPool: GachaPool
  let vrf: VRFCoordinatorV2_5Mock
  let hh_ethers: any
  let deployer: any
  beforeEach("Deploy GachaPool", async function () {
    const { ethers, ignition } = await network.connect()
    hh_ethers = ethers
    deployer = (await ethers.getSigners())[0]

    const { proxy: _gacha } = await ignition.deploy(gachaPoolModule)
    gachaPool = await ethers.getContractAt("GachaPool", _gacha.target)
    const _vrf = await gachaPool.getAddressVRF()
    vrf = await ethers.getContractAt("VRFCoordinatorV2_5Mock", _vrf)
  })

  it("Should successfully GachaTen", async function () {
    // 先前的 remaining
    const remaining = await gachaPool.getRemaining()
    // 抽卡
    const tx = await gachaPool.gachaTen({ value: parseEther("0.9") })
    // const receipt = await tx.wait()
    const reqId = 1n // 实际场景可以监听事件或者从 tx 读取
    // 发出抽卡事件
    await expect(tx).to.emit(gachaPool, "GachaTen").withArgs(deployer, 1)
    // 余额变动
    await expect(tx).to.changeEtherBalances(
      hh_ethers,
      [gachaPool.target, deployer],
      [parseEther("0.9"), -parseEther("0.9")],
    )
    // remaining 变动
    expect(await gachaPool.getRemaining()).equal(remaining - 10n)
    // VRF 给出随机数
    const words = [70n, 71n, 72n, 73n, 74n, 75n, 76n, 77n, 78n, 79n] // R * 10
    const rarity = [3n, 3n, 3n, 3n, 3n, 3n, 3n, 3n, 3n, 1n] // R * 9 , 最后一个保底为 SSR
    await vrf.fulfillRandomWordsWithOverride(reqId, gachaPool.target, words)
    // 检查抽卡结果
    const result = await gachaPool.getResult(reqId)
    expect(result[0]).equal(10) // numWords
    // 如果保底会把最后一个随机数写为0
    const wordsGuaranteed = words.slice(0, 9)
    wordsGuaranteed.push(0n)
    expect(result[1]).to.have.ordered.members(wordsGuaranteed) // words
    expect(result[2]).to.have.ordered.members(rarity) // rarity.
  })

  it("Prevent worse guarantee", async function () {
    await gachaPool.gachaTen({ value: parseEther("0.9") })
    const words = [70n, 71n, 72n, 73n, 74n, 75n, 76n, 77n, 78n, 99n] // R * 9, 最后一个是 UR
    const rarity = [3n, 3n, 3n, 3n, 3n, 3n, 3n, 3n, 3n, 0n] // 最后一个不应该被保底为 SSR
    await vrf.fulfillRandomWordsWithOverride(1n, gachaPool.target, words)
    const result = await gachaPool.getResult(1n)
    expect(result[1]).to.have.ordered.members(words) // words
    expect(result[2]).to.have.ordered.members(rarity) // rarity.
  })

  it("InsufficientFunds", async function () {
    // value 为0
    await expect(gachaPool.gachaTen()).to.revertedWithCustomError(gachaPool, "InsufficientFunds")
    // value 不够
    await expect(gachaPool.gachaTen({ value: parseEther("0.8999") })).to.revertedWithCustomError(
      gachaPool,
      "InsufficientFunds",
    )
    // value 刚好
    await expect(gachaPool.gachaTen({ value: parseEther("0.9") })).to.emit(gachaPool, "GachaTen")
    // value 多余
    await expect(gachaPool.gachaTen({ value: parseEther("0.91") })).to.emit(gachaPool, "GachaTen")
  })

  it("OutOfStock", async function () {
    // 消耗 supply
    for (let i = 0; i < 10; i++) {
      await gachaPool.gachaTen({ value: parseEther("0.9") })
    }
    // 无法继续
    await expect(gachaPool.gachaTen({ value: parseEther("0.9") })).to.revertedWithCustomError(gachaPool, "OutOfStock")
  })

  describe("GachaTen Change Config", function () {
    beforeEach(async () => {
      await gachaPool.pause()
    })

    it("setGuarantee false", async function () {
      await gachaPool.setGuarantee(false)
      await gachaPool.unpause()
      await gachaPool.gachaTen({ value: parseEther("0.9") })
      const words = [70n, 71n, 72n, 73n, 74n, 75n, 76n, 77n, 78n, 79n] // R * 10
      const rarity = [3n, 3n, 3n, 3n, 3n, 3n, 3n, 3n, 3n, 3n] // 不保底
      await vrf.fulfillRandomWordsWithOverride(1n, gachaPool.target, words)
      const result = await gachaPool.getResult(1n)
      expect(result[1]).to.have.ordered.members(words) // words
      expect(result[2]).to.have.ordered.members(rarity) // rarity.
    })

    it("setGuaranteeRarity UR", async function () {
      await gachaPool.setGuaranteeRarity(0)
      await gachaPool.unpause()
      await gachaPool.gachaTen({ value: parseEther("0.9") })
      const words = [70n, 71n, 72n, 73n, 74n, 75n, 76n, 77n, 78n, 79n] // R * 10
      const rarity = [3n, 3n, 3n, 3n, 3n, 3n, 3n, 3n, 3n, 0n] // 保底为 UR
      await vrf.fulfillRandomWordsWithOverride(1n, gachaPool.target, words)
      const result = await gachaPool.getResult(1n)
      const wordsGuaranteed = words.slice(0, 9)
      wordsGuaranteed.push(0n)
      expect(result[1]).to.have.ordered.members(wordsGuaranteed) // words
      expect(result[2]).to.have.ordered.members(rarity) // rarity.
    })

    describe("setDiscountGachaTen", function () {
      it("Free", async function () {
        await gachaPool.setDiscountGachaTen(0)
        await gachaPool.unpause()
        await expect(gachaPool.gachaTen()).to.emit(gachaPool, "GachaTen")
      })

      it("20% off", async function () {
        await gachaPool.setDiscountGachaTen(80)
        await gachaPool.unpause()
        // value 不够
        await expect(gachaPool.gachaTen({ value: parseEther("0.7999") })).to.revertedWithCustomError(
          gachaPool,
          "InsufficientFunds",
        )
        // value 刚好
        await expect(gachaPool.gachaTen({ value: parseEther("0.8") })).to.emit(gachaPool, "GachaTen")
      })

      it("No discount", async function () {
        await gachaPool.setDiscountGachaTen(100)
        await gachaPool.unpause()
        // value 不够
        await expect(gachaPool.gachaTen({ value: parseEther("0.9999") })).to.revertedWithCustomError(
          gachaPool,
          "InsufficientFunds",
        )
        // value 刚好
        await expect(gachaPool.gachaTen({ value: parseEther("1") })).to.emit(gachaPool, "GachaTen")
      })
    })
  })
})
