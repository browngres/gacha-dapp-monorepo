import { expect } from "chai"
import { network } from "hardhat"
import { parseEther } from "ethers"
import type { GachaPool } from "../types/ethers-contracts/index.js"
import gachaPoolModule from "../ignition/modules/GachaPool.js"
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types"

// !! 注意 await 写与不写，以及在哪里写
// !! 读取值的时候在 expect 里面 await； 期望 revert 或 emit 的时候在外面 await

describe("GachaPool Admin Set Unit Tests", function () {
  let gachaPool: GachaPool
  let nonAdmin: HardhatEthersSigner
  before(async function () {
    // 所有之前部署一次
    const { ethers, ignition } = await network.connect()
    const signers = await ethers.getSigners()
    nonAdmin = signers[1]
    const { proxy: _gacha } = await ignition.deploy(gachaPoolModule)
    gachaPool = await ethers.getContractAt("GachaPool", _gacha.target)
  })

  it("Should pause before set", async function () {
    // 没有 pause 就 set
    await expect(gachaPool.setCostGwei(100)).to.be.revertedWithCustomError(gachaPool, "ExpectedPause")
  })

  it("Only admin can set", async function () {
    await expect(gachaPool.connect(nonAdmin).setCostGwei(100)).to.be.revertedWithCustomError(
      gachaPool,
      "AccessControlUnauthorizedAccount",
    )
  })

  describe("Admin pause and set", function () {
    beforeEach(async function () {
      await gachaPool.pause()
    })
    afterEach(async function () {
      await gachaPool.unpause()
    })

    it("Should successfully setCostGwei", async function () {
      const tx = gachaPool.setCostGwei(100)
      await expect(tx).to.emit(gachaPool, "CostGweiChanged")
      expect(await gachaPool.costGwei()).to.equal(100)
    })

    it("Should successfully setDiscountGachaTen", async function () {
      // 不能超过 100
      await expect(gachaPool.setDiscountGachaTen(200)).to.be.revertedWithCustomError(gachaPool, "InvalidDiscount")

      await expect(gachaPool.setDiscountGachaTen(66)).to.emit(gachaPool, "DiscountGachaTenChanged")
      expect(await gachaPool.discountGachaTen()).to.equal(66)
    })

    it("Should successfully setGuarantee", async function () {
      await expect(gachaPool.setGuarantee(true)).to.emit(gachaPool, "GuaranteeChanged")
      expect(await gachaPool.guarantee()).to.equal(true)

      await expect(gachaPool.setGuarantee(false)).to.emit(gachaPool, "GuaranteeChanged")
      expect(await gachaPool.guarantee()).to.equal(false)
    })

    it("Should successfully setGuaranteeRarity", async function () {
      await expect(gachaPool.setGuaranteeRarity(2)).to.emit(gachaPool, "GuaranteeRarityChanged")
      expect(await gachaPool.guaranteeRarity()).to.equal(2)
    })
  })
})

describe("GachaPool Admin Pause Unit Tests", function () {
  let gachaPool: GachaPool
  let nonAdmin: HardhatEthersSigner

  beforeEach(async function () {
    // 每个之前部署
    const { ethers, ignition } = await network.connect()
    const signers = await ethers.getSigners()
    nonAdmin = signers[1]
    const { proxy: _gacha } = await ignition.deploy(gachaPoolModule)
    gachaPool = await ethers.getContractAt("GachaPool", _gacha.target)
  })

  it("Only admin can pause and unpause", async function () {
    await expect(gachaPool.connect(nonAdmin).pause()).to.be.revertedWithCustomError(
      gachaPool,
      "AccessControlUnauthorizedAccount",
    )
    await expect(gachaPool.pause()).to.emit(gachaPool, "Paused")
    expect(await gachaPool.paused()).equal(true)

    await expect(gachaPool.connect(nonAdmin).unpause()).to.be.revertedWithCustomError(
      gachaPool,
      "AccessControlUnauthorizedAccount",
    )
    await expect(gachaPool.unpause()).to.emit(gachaPool, "Unpaused")
    expect(await gachaPool.paused()).equal(false)
  })

  it("Cannot pause if there are requests processing", async function () {
    // 发出随机数请求，但是还没有 fulfill，属于处理中。此时不能 pause
    expect(await gachaPool.paused()).equal(false)
    await gachaPool.gachaOne({ value: parseEther("0.1") })
    await expect(gachaPool.pause()).to.be.revertedWithCustomError(gachaPool, "CannotPause")
  })
})

describe("GachaPool Admin Withdraw Unit Tests", function () {
  it("Should successfully  withdraw", async function () {
    const { ethers, ignition } = await network.connect()
    const signers = await ethers.getSigners()
    const deployer = signers[0]
    const nonAdmin = signers[1]
    const { proxy: _gacha } = await ignition.deploy(gachaPoolModule)
    const gachaPool = await ethers.getContractAt("GachaPool", _gacha.target)

    // 余额为 0 不能提
    await expect(gachaPool.withdraw()).to.be.revertedWithCustomError(gachaPool, "WithdrawFailed")

    // only admin
    await expect(gachaPool.connect(nonAdmin).withdraw()).to.be.revertedWithCustomError(
      gachaPool,
      "AccessControlUnauthorizedAccount",
    )

    await gachaPool.gachaOne({ value: parseEther("0.1") })

    // 对一个操作进行多个 expect，不能链式，需要逐个进行
    const tx = gachaPool.withdraw()
    await expect(tx).to.changeEtherBalances(
      ethers,
      [gachaPool.target, deployer],
      [-parseEther("0.1"), parseEther("0.1")], // 期望余额变动
    )
    await expect(tx).to.emit(gachaPool, "Withdraw")
  })
})
