import { expect } from "chai"
import { network } from "hardhat"
import { deployGachaPoolFixture } from "./DeployFixture.js"
import predictDeterministicAddress from "../scripts/predictDeterministicAddress.js"

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
    expect((await gacha.getPoolConfig())[0]).equal(ethers.parseUnits("0.1", "gwei")) // costGwei
    expect((await gacha.getPoolConfig())[1]).equal(1) // poolId
    expect((await gacha.getPoolConfig())[2]).equal(100) // supply
    expect((await gacha.getPoolConfig())[3]).equal(90) // discountGachaTen
    expect((await gacha.getPoolConfig())[4]).equal(true) // guarantee
    expect((await gacha.getPoolConfig())[5]).equal(1) // guaranteeRarity

    const percentages = (await gacha.getPoolConfig())[6]
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

    // 检查 remaining
    expect(await gacha.getRemaining()).equal(100n)

    // 检查 NFT
    expect(await gacha.GACHA_CARD_NFT()).equal(ethers.ZeroAddress)

    // 部署 NFT 合约
    // create 3 的地址计算与 initCode 无关，也就是跟代码无关，只与部署者地址和salt 有关。
    await gacha.deployGachaCardNFT("NFT", "NFT")
    const salt = ethers.keccak256(ethers.toUtf8Bytes("GachaPoolSalt"))
    // salt:  keccak256(bytes("GachaPoolSalt"))
    // 0xab8783a6a379b7674e450a4379caea3bb139d90cb243c7f7b17d4a608e184a53
    // deployer: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
    const predict = predictDeterministicAddress(salt,gacha.target)
    expect(await gacha.GACHA_CARD_NFT()).equal(    ethers.getAddress(predict.toString()))
  })
})
