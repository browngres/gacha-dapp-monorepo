import { expect } from "chai"
import { network } from "hardhat"
import deployGachaPoolFixture from "./DeployFixture.js"

describe("GachaPool init Unit Tests", async function () {
  it("Should successfully initialized with Fixture given config", async function () {
    const { ethers, networkHelpers } = await network.connect()
    const {
      vrf,
      subId,
      gachaPool: impl,
      beacon,
      proxy: gacha,
    } = await networkHelpers.loadFixture(deployGachaPoolFixture)
    const [deployer] = await ethers.getSigners()

    // 检查初始化参数
    expect(await beacon.implementation()).equal(impl.target, "beacon's implement address is wrong.")
    expect(await gacha.poolId()).equal(1)
    expect(await gacha.supply()).equal(100)
    expect(await gacha.costGwei()).equal(ethers.parseUnits("0.1", "gwei"))
    expect(await gacha.claimSigner()).equal(deployer.address)

    // 检查订阅
    const ids = await vrf.getActiveSubscriptionIds(0, 10)
    expect(ids).to.have.lengthOf(1, "VRF has one subscription.")
    expect(ids).to.include(subId, "This subscription is ours.")

    // 检查 consumer
    const sub = await vrf.getSubscription(subId)
    expect(sub.consumers).to.be.lengthOf(1, "The subscription has one consumer.")
    expect(sub.balance).equal(ethers.parseEther("100"), "The subscription balance is 100.")
  })
})

// 测试 percentage  1. 长度不对报错  2. 读取概率是否相同
// expect([1, 2, 3]).to.have.lengthOf(3);
