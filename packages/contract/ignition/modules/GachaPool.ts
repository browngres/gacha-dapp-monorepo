import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import VRFModule from "./VRF.js"
import { parseEther, parseUnits } from "ethers"
import type { GachaPool } from "../../types/ethers-contracts/index.js"

// beacon 代理方式部署
// 1. Deploy implementation
// 2. Deploy beacon
// 3. Deploy proxy with initialization data
// 部署实现合约不给参数，后面调用 init 才给

export const gachaPoolModule = buildModule("GachaPoolModule", (m) => {
  // 部署或使用现有 VRF
  const { VRFMock } = m.useModule(VRFModule)

  // 存款并订阅
  // mock 版本的合约订阅不需要付款，是 nonpayable，可以任意 fundAmount
  const fundAmount = parseEther("100") // 存入 100 link
  const subscription = m.call(VRFMock, "createSubscription")
  const subId = m.readEventArgument(subscription, "SubscriptionCreated", "subId")
  m.call(VRFMock, "fundSubscription", [subId, fundAmount])

  // 部署 GachaPool 实现和 Beacon
  const deployer = m.getAccount(0)
  console.log("🚀 Deploying GachaPool with account:", deployer.accountIndex)
  const impl = m.contract("GachaPool", [], { id: "GachaPoolImplement", from: deployer })
  const beacon = m.contract("UpgradeableBeacon", [impl, deployer])

  // 准备参数
  const keyHash = "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc" // 随意，mock 中没用
  const defaultConfig: GachaPool.PoolConfigStruct = {
    poolId: 1,
    supply: 100,
    costGwei: parseUnits("0.1", "gwei"), // 单次费用 0.1 ether，转换为 gwei
    discountGachaTen: 90, // 9折
    guarantee: true,
    guaranteeRarity: 1,
    percentages: [2, 8, 10, 20, 60],
  }

  const initCallData = m.encodeFunctionCall(impl, "initialize", [
    subId,
    VRFMock,
    keyHash,
    deployer,
    deployer, // signer
    defaultConfig,
  ])

  // 部署 proxy
  const proxy = m.contract("BeaconProxy", [beacon, initCallData], { from: deployer })

  // 添加 consumer 到订阅中
  m.call(VRFMock, "addConsumer", [subId, proxy])

  // 将实现合约的 ABI 加载到代理
  /*
  Tell Ignition to use the impl ABI for the contract at the address of the proxy.
  This will allow us to interact with the contract through the proxy when we use it in tests or scripts.
  */
  const gachaPool = m.contractAt("GachaPool", proxy)

  // 部署卡池 NFT
  const NFT_NAME = "Gacha Card"
  const NFT_SYMBOL = "GC"
  m.call(gachaPool, "deployGachaCardNFT", [NFT_NAME, NFT_SYMBOL])

  // （可选）设置 NFT URI
  const NFT_BASE_URI = process.env.NFT_BASE_URI || "https://example.com/nft/"
  const NFT_CONTRACT_URI = process.env.NFT_CONTRACT_URI || "https://example.com/nft/contract-metadata.json"
  m.call(gachaPool, "setNftUri", [NFT_BASE_URI, NFT_CONTRACT_URI])

  return { gachaPool, beacon, proxy }
})

export default gachaPoolModule
