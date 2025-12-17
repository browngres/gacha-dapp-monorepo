import { expect } from "chai"
import { network } from "hardhat"
import { deployGachaPoolFixture } from "./DeployFixture.js"

describe("GachaPool init Unit Tests", function () {
  it("Should successfully initialized with Fixture given config", async function () {
    const { ethers, networkHelpers } = await network.connect()
    const {
      vrf,
      subId,
      gachaPool: impl,
      beacon,
      proxy: gacha,
    } = await networkHelpers.loadFixture(deployGachaPoolFixture)
    // 3.20 M Gas

    const [deployer] = await ethers.getSigners()

    // 检查初始化参数
    expect(await beacon.implementation()).equal(impl.target, "beacon's implement address is wrong.")
    expect(await gacha.poolId()).equal(1)
    expect(await gacha.supply()).equal(100)
    expect(await gacha.costGwei()).equal(ethers.parseUnits("0.1", "gwei"))
    expect(await gacha.discountGachaTen()).equal(90)
    expect(await gacha.guarantee()).equal(true)
    expect(await gacha.guaranteeRarity()).equal(1)

    const percentages = await gacha.percentages()
    expect(percentages[0]).equal(2)
    expect(percentages[1]).equal(8)
    expect(percentages[2]).equal(10)
    expect(percentages[3]).equal(20)
    expect(percentages[4]).equal(60)

    expect(await gacha.claimSigner()).equal(deployer.address)
    expect(await gacha.getAddressVRF()).equal(vrf.target)

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
