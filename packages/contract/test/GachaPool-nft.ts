import { expect } from "chai"
import { network } from "hardhat"
import gachaPoolModule from "../ignition/modules/GachaPool.js"
import predictDeterministicAddress from "../scripts/predictDeterministicAddress.js"
import { deployGachaPoolFixture } from "./DeployFixture.js"

describe("GachaPool NFT Unit Tests", function () {
  it.only("Should deployed before gacha", async function () {
    // deployGachaPoolFixture 只部署 GachaPoll，没有调用部署 NFT 的方法
    const { ethers, networkHelpers } = await network.connect()
    const { proxy: gachaPool } = await networkHelpers.loadFixture(deployGachaPoolFixture)
    expect(await gachaPool.GACHA_CARD_NFT()).equal(ethers.ZeroAddress)

    // 没有部署 NFT 不能抽
    await expect(gachaPool.gachaOne({ value: ethers.parseEther("0.1") })).to.be.revertedWithCustomError(
      gachaPool,
      "NoDeploymentNFT",
    )
    await expect(gachaPool.gachaTen({ value: ethers.parseEther("0.9") })).to.be.revertedWithCustomError(
      gachaPool,
      "NoDeploymentNFT",
    )

    await gachaPool.deployGachaCardNFT("NFT", "NFT")
    // 部署之后可以抽
    await expect(gachaPool.gachaOne({ value: ethers.parseEther("0.1") })).to.emit(gachaPool, "GachaOne")
    await expect(gachaPool.gachaTen({ value: ethers.parseEther("0.9") })).to.emit(gachaPool, "GachaTen")
  })

  describe("CREATE3", function () {
    it.only("Should successfully deployed NFT at the deterministic address", async function () {
      const { ethers, ignition } = await network.connect()
      const { proxy: _gacha } = await ignition.deploy(gachaPoolModule)
      const gachaPool = await ethers.getContractAt("GachaPool", _gacha.target)

      const salt = ethers.keccak256(ethers.toUtf8Bytes("GachaPoolSalt"))
      // 使用已知的 salt 和 部署者 预测 create 3 地址
      const prediction = predictDeterministicAddress(salt, gachaPool.target)
      expect(await gachaPool.GACHA_CARD_NFT()).equal(ethers.getAddress(prediction.toString()))

      // salt keccak256(bytes("GachaPoolSalt"))
      // 0xab8783a6a379b7674e450a4379caea3bb139d90cb243c7f7b17d4a608e184a53

      // address.this
      // 0x5fc8d32690cc91d4c39d9d3abcbd16989f875707

      // predictDeterministicAddress
      // 0x449dA61f956ea8EAB7Bc2543eaFd2680861BeaB8
    })

    it("Should only deploy once", async function () {
      const { ethers, ignition } = await network.connect()
      const { proxy: _gacha } = await ignition.deploy(gachaPoolModule)
      const gachaPool = await ethers.getContractAt("GachaPool", _gacha.target)
      // 重复部署
      await expect(gachaPool.deployGachaCardNFT("NFT", "NFT")).to.revert(ethers)
    })

    it("Should different between pools", async function () {
      const { ethers, ignition } = await network.connect()
      const { proxy: _gacha1 } = await ignition.deploy(gachaPoolModule)
      const { proxy: _gacha2 } = await ignition.deploy(gachaPoolModule)

      // 两个卡池
      expect(_gacha1.target).not.equal(_gacha2.target)
      const gachaPool1 = await ethers.getContractAt("GachaPool", _gacha1.target)
      const gachaPool2 = await ethers.getContractAt("GachaPool", _gacha2.target)

      // 两个卡池的 NFT 应该不同
      expect(await gachaPool1.GACHA_CARD_NFT()).not.equal(ethers.ZeroAddress)
      expect(await gachaPool2.GACHA_CARD_NFT()).not.equal(ethers.ZeroAddress)
      expect(await gachaPool1.GACHA_CARD_NFT()).not.equal(await gachaPool2.GACHA_CARD_NFT())
    })
  })

  describe("GachaPool NFT URI", function () {
    it("Should successfully set URI", async function () {
      const { ethers, ignition } = await network.connect()
      const { proxy: _gacha } = await ignition.deploy(gachaPoolModule)
      const gachaPool = await ethers.getContractAt("GachaPool", _gacha.target)
      const nft = await ethers.getContractAt("GachaCardNFT", await gachaPool.GACHA_CARD_NFT())

      // 设置之前
      expect(await nft.tokenURI(1n)).equal("https://example.com/nft/1")
      expect(await nft.contractURI()).equal("https://example.com/nft/contract-metadata.json")

      await gachaPool.setNftUri("https://new.example.com/nft/", "https://new.example.com/nft/contract-metadata.json")

      // 设置之后
      expect(await nft.tokenURI(1n)).equal("https://new.example.com/nft/1")
      expect(await nft.contractURI()).equal("https://new.example.com/nft/contract-metadata.json")
    })

    it("Only GachaPool contract can set URI", async function () {
      const { ethers, ignition } = await network.connect()
      const { proxy: _gacha } = await ignition.deploy(gachaPoolModule)
      const gachaPool = await ethers.getContractAt("GachaPool", _gacha.target)
      const [_, another] = await ethers.getSigners()

      const tx = await gachaPool
        .connect(another)
        .setNftUri("https://another.example.com/nft/", "https://another.example.com/nft/contract-metadata.json")
      await expect(tx).to.revertedWithCustomError(gachaPool, "AccessControlUnauthorizedAccount")
    })
  })
})
