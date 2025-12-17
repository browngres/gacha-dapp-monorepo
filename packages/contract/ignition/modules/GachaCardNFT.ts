import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const GachaCardModule = buildModule("GachaCardModule", (m) => {
  const deployer = m.getAccount(0)
  const GachaCard = m.contract("GachaCardNFT", ["Gacha Card", "GC", deployer])

  // 部署后必须手动设置这两个 URI
  m.call(GachaCard, "setBaseURI", ["http://127.0.0.1/nft/"])
  m.call(GachaCard, "setContractURI", ["http://127.0.0.1/nft/contract-metadata.json"])
  return { GachaCard }
})

export default GachaCardModule
