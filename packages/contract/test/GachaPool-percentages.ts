import { expect } from "chai"
import { network } from "hardhat"
import { deployGachaPoolFixture } from "./DeployFixture.js"
import { parseUnits } from "ethers"
import type { GachaPool, UpgradeableBeacon } from "../types/ethers-contracts/index.js"

describe("GachaPool Percentage Unit Tests", function () {
  it("Should successfully initialized with Fixture given percentage config", async function () {
    const { networkHelpers } = await network.connect()
    const { proxy: gacha } = await networkHelpers.loadFixture(deployGachaPoolFixture)

    expect(await gacha.percentages(0)).equal(2)
    expect(await gacha.percentages(1)).equal(8)
    expect(await gacha.percentages(2)).equal(10)
    expect(await gacha.percentages(3)).equal(20)
    expect(await gacha.percentages(4)).equal(60)
  })

  describe("Wrong percentage initializing revert", function () {
    let gachaPool: GachaPool
    let beacon: UpgradeableBeacon
    const keyHash = "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc" // 随意，mock 中没用
    let deployer: any
    let hh_ether: any

    beforeEach(async function () {
      // 每次提前部署
      const { ethers } = await network.connect()
      hh_ether = ethers
      const [_deployer] = await ethers.getSigners()
      deployer = _deployer
      gachaPool = await ethers.deployContract("GachaPool", [], deployer)
      beacon = await ethers.deployContract("UpgradeableBeacon", [gachaPool, deployer], deployer)
    })

    it("Should revert if percentage sum is not 100", async function () {
      // percentages 合计不为 100
      const percentages: number[] = [10, 10, 10, 10, 10]
      const initCallData = gachaPool.interface.encodeFunctionData("initialize", [
        0,
        "0x0123456789012345678901234567890123456789",
        keyHash,
        deployer.address,
        1, // poolId
        100, // supply
        parseUnits("0.1", "gwei"), // 单次费用 0.1 ether，转换为 gwei
        deployer.address, // signer
        percentages, // 概率
      ])
      // 初始化时 revert
      await expect(hh_ether.deployContract("BeaconProxy", [beacon, initCallData])).to.be.revertedWithCustomError(
        gachaPool,
        "InvalidRarityPercentage",
      )
    })

    it("Should revert if percentage length is not 5", async function () {
      // percentages 长度不为 5
      const percentages: number[] = [25, 25, 25, 25]
      const initCallData = gachaPool.interface.encodeFunctionData("initialize", [
        0,
        "0x0123456789012345678901234567890123456789",
        keyHash,
        deployer.address,
        1, // poolId
        100, // supply
        parseUnits("0.1", "gwei"), // 单次费用 0.1 ether，转换为 gwei
        deployer.address, // signer
        percentages, // 概率
      ])
      // 初始化时 revert
      await expect(hh_ether.deployContract("BeaconProxy", [beacon, initCallData])).to.be.revertedWithCustomError(
        gachaPool,
        "InvalidRarityPercentage",
      )
    })
  })

  describe("Set percentage", function () {
    it("Must paused", async function () {
      // 必须提前暂停
      const { networkHelpers } = await network.connect()
      const { proxy: gacha } = await networkHelpers.loadFixture(deployGachaPoolFixture)
      await expect(gacha.setPercentage([20, 20, 20, 20, 20])).to.be.revertedWithCustomError(gacha, "ExpectedPause")
    })

    it("Only admin can set", async function () {
      // 必须有 admin role
      const { ethers, networkHelpers } = await network.connect()
      const { proxy: gacha } = await networkHelpers.loadFixture(deployGachaPoolFixture)
      await gacha.pause()
      const notAdmin = (await ethers.getSigners())[2]
      // TODO 不会 revert
      // await expect(await gacha.connect(notAdmin).setPercentage([20, 20, 20, 20, 20])).to.be.revertedWithCustomError(
      //   gacha,
      //   "AccessControlUnauthorizedAccount",
      // )
      await expect(gacha.connect(notAdmin).setPercentage([20, 20, 20, 20, 20])).to.be.revert(ethers)
    })

    it("Should set correctly", async function () {
      // 正常设置
      const { networkHelpers } = await network.connect()
      const { proxy: gacha } = await networkHelpers.loadFixture(deployGachaPoolFixture)
      expect(await gacha.percentages(0)).equal(2)
      expect(await gacha.percentages(1)).equal(8)
      expect(await gacha.percentages(2)).equal(10)
      expect(await gacha.percentages(3)).equal(20)
      expect(await gacha.percentages(4)).equal(60)
      await gacha.pause()
      await gacha.setPercentage([5, 15, 20, 25, 35])
      expect(await gacha.percentages(0)).equal(5)
      expect(await gacha.percentages(1)).equal(15)
      expect(await gacha.percentages(2)).equal(20)
      expect(await gacha.percentages(3)).equal(25)
      expect(await gacha.percentages(4)).equal(35)
    })
  })
})
