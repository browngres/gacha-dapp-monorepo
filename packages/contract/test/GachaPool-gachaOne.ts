import { expect } from "chai"
import { network } from "hardhat"
import gachaPoolModule from "../ignition/modules/GachaPool.js"
import type { GachaPool, VRFCoordinatorV2_5Mock } from "../types/ethers-contracts/index.js"
import { parseEther } from "ethers"

// 测试抽卡流程，不包括兑奖
describe("GachaPool GachaOne Unit Tests", function () {
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

  it("Should successfully GachaOne", async function () {
    // 先前的 remaining 和 playersCount
    const remaining = await gachaPool.getRemaining()
    const playersCount = await gachaPool.getPlayersCount()

    // 抽卡
    const tx = await gachaPool.gachaOne({ value: parseEther("0.1") })
    // const receipt = await tx.wait()
    const reqId = 1n // 实际场景可以监听事件或者从 tx 读取
    // 发出抽卡事件
    await expect(tx).to.emit(gachaPool, "GachaOne").withArgs(deployer, 1)
    // 余额变动
    await expect(tx).to.changeEtherBalances(
      hh_ethers,
      [gachaPool.target, deployer],
      [parseEther("0.1"), -parseEther("0.1")],
    )
    // remaining 和 playersCount 变动
    expect(await gachaPool.getRemaining()).equal(remaining - 1n)
    expect(await gachaPool.getPlayersCount()).equal(playersCount + 1n)
    // getPlayer
    expect(await gachaPool.getPlayer(1n)).equal(deployer)
    // VRF 给出随机数
    await vrf.fulfillRandomWordsWithOverride(reqId, gachaPool.target, [99n])
    // 检查抽卡结果
    const result = await gachaPool.getResult(reqId)
    expect(result[0]).equal(1) // numWords
    expect(result[1]).to.have.ordered.members([99n]) // words
    expect(result[2]).to.have.ordered.members([0n]) // rarity  UR
    // 检查抽卡记录
    const requests = await gachaPool.getRequests(deployer)
    expect(requests).to.include.members([reqId]) // words
  })

  it("InsufficientFunds", async function () {
    // value 为0
    await expect(gachaPool.gachaOne()).to.revertedWithCustomError(gachaPool, "InsufficientFunds")
    // value 不够
    await expect(gachaPool.gachaOne({ value: parseEther("0.01") })).to.revertedWithCustomError(
      gachaPool,
      "InsufficientFunds",
    )
    // value 刚好
    await expect(gachaPool.gachaOne({ value: parseEther("0.1") })).to.emit(gachaPool, "GachaOne")
    // value 多余
    await expect(gachaPool.gachaOne({ value: parseEther("0.11") })).to.emit(gachaPool, "GachaOne")
  })

  it("OutOfStock", async function () {
    // 消耗 supply
    for (let i = 0; i < 100; i++) {
      await gachaPool.gachaOne({ value: parseEther("0.1") })
    }
    // 无法继续
    await expect(gachaPool.gachaOne({ value: parseEther("0.1") })).to.revertedWithCustomError(gachaPool, "OutOfStock")
  })

  it("whenNotPaused", async function () {
    // 消耗 supply
    gachaPool.pause()
    // 暂停时不能抽
    await expect(gachaPool.gachaOne({ value: parseEther("0.1") })).to.revertedWithCustomError(
      gachaPool,
      "EnforcedPause",
    )
  })

  it("Players and Results Count", async function () {
    const [_, signer1, signer2] = await hh_ethers.getSigners()
    // 初始值
    expect(await gachaPool.getPlayersCount()).equal(0n)

    // 多次抽
    await gachaPool.connect(signer1).gachaOne({ value: parseEther("0.1") })
    await gachaPool.connect(signer1).gachaOne({ value: parseEther("0.1") })

    expect(await gachaPool.getPlayersCount()).equal(1n)

    // 换人抽
    await gachaPool.connect(signer2).gachaOne({ value: parseEther("0.1") })
    await gachaPool.connect(signer2).gachaOne({ value: parseEther("0.1") })
    await gachaPool.connect(signer2).gachaOne({ value: parseEther("0.1") })

    expect(await gachaPool.getPlayersCount()).equal(2n)

    // request 数量
    const requests1 = await gachaPool.getRequests(signer1)
    const requests2 = await gachaPool.getRequests(signer2)
    expect(requests1).to.have.lengthOf(2)
    expect(requests2).to.have.lengthOf(3)
  })
})

// PlayersCount, 重复抽，换人抽
