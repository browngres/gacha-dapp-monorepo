import { expect } from "chai"
import { network } from "hardhat"
import { parseUnits } from "ethers"
import type { GachaPool, UpgradeableBeacon } from "../types/ethers-contracts/index.js"
import gachaPoolModule from "../ignition/modules/GachaPool.js"

describe("GachaPool Percentage Unit Tests", function () {
  it("Should successfully initialized with given percentage config", async function () {
    const { ethers, ignition } = await network.connect()
    const { proxy: _gacha } = await ignition.deploy(gachaPoolModule)
    const gachaPool = await ethers.getContractAt("GachaPool", _gacha.target)
    const percentages = await gachaPool.percentages()
    expect(percentages[0]).equal(2)
    expect(percentages[1]).equal(8)
    expect(percentages[2]).equal(10)
    expect(percentages[3]).equal(20)
    expect(percentages[4]).equal(60)
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
      const badPercentages: [number, number, number, number, number] = [10, 10, 10, 10, 10]

      const defaultConfig: GachaPool.PoolConfigStruct = {
        poolId: 1,
        supply: 100,
        costGwei: parseUnits("0.1", "gwei"), // 单次费用 0.1 ether，转换为 gwei
        discountGachaTen: 90, // 9折
        guarantee: true,
        guaranteeRarity: 1,
        percentages: badPercentages,
      }
      const initCallData = gachaPool.interface.encodeFunctionData("initialize", [
        0,
        "0x0123456789012345678901234567890123456789",
        keyHash,
        deployer.address,
        deployer.address, // signer
        defaultConfig,
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
      const { ethers, ignition } = await network.connect()
      const { proxy: _gacha } = await ignition.deploy(gachaPoolModule)
      const gachaPool = await ethers.getContractAt("GachaPool", _gacha.target)
      await expect(gachaPool.setPercentage([20, 20, 20, 20, 20])).to.be.revertedWithCustomError(
        gachaPool,
        "ExpectedPause",
      )
    })

    it("Only admin can set", async function () {
      // 必须有 admin role
      const { ethers, ignition } = await network.connect()
      const { proxy: _gacha } = await ignition.deploy(gachaPoolModule)
      // ! 天知道这个 fixture 害我找 bug 找多久。bug 位于 git commit `8a9a3ded` 。 还是 ignition 好！
      // const { proxy: gacha } = await networkHelpers.loadFixture(deployGachaPoolFixture)
      const gachaPool = await ethers.getContractAt("GachaPool", _gacha.target)
      await gachaPool.pause()
      // 使用非 admin 账户
      const notAdmin = (await ethers.getSigners())[1]
      await expect(gachaPool.connect(notAdmin).setPercentage([20, 20, 20, 20, 20])).to.be.revertedWithCustomError(
        gachaPool,
        "AccessControlUnauthorizedAccount",
      )
    })

    it("Should set correctly", async function () {
      // 正常设置
      const { ethers, ignition } = await network.connect()
      const { proxy: _gacha } = await ignition.deploy(gachaPoolModule)
      const gachaPool = await ethers.getContractAt("GachaPool", _gacha.target)

      const percentages = await gachaPool.percentages()
      expect(percentages[0]).equal(2)
      expect(percentages[1]).equal(8)
      expect(percentages[2]).equal(10)
      expect(percentages[3]).equal(20)
      expect(percentages[4]).equal(60)

      await gachaPool.pause()
      await gachaPool.setPercentage([5, 15, 20, 25, 35])
      const newPercentages = await gachaPool.percentages()
      expect(newPercentages[0]).equal(5)
      expect(newPercentages[1]).equal(15)
      expect(newPercentages[2]).equal(20)
      expect(newPercentages[3]).equal(25)
      expect(newPercentages[4]).equal(35)
    })
  })
})
