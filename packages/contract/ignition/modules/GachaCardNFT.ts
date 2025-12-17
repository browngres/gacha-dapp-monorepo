import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const GachaCardModule = buildModule("GachaCardModule", (m) => {
  const GachaCard = m.contract("GachaCardNFT", ["Gacha Card", "GC"])
  m.call(GachaCard, "setBaseURI", ["http://127.0.0.1/nft"])
  m.call(GachaCard, "setContractURI", ["http://127.0.0.1/nft/contract-metadata.json"])
  return { GachaCard }
})

export default GachaCardModule
