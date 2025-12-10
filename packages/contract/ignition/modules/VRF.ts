import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import { parseEther, parseUnits } from "ethers"
// 部署 mock VRF + consumer
// 附带订阅操作

const VRFModule = buildModule("VRFModule", (m) => {
  // 部署 VRF Coordinator Mock
  const BASE_FEE = parseEther("0.001") // 0.001 ether as base fee
  const GAS_PRICE = parseUnits("50", "gwei") // 50 gwei
  const WEI_PER_UNIT_LINK = parseEther("0.01") // 0.01 ether per LINK

  const VRFMock = m.contract("VRFCoordinatorV2_5Mock", [BASE_FEE, GAS_PRICE, WEI_PER_UNIT_LINK])

  // 存款并订阅
  // mock 版本的合约订阅不需要付款，是 nonpayable，可以任意 fundAmount
  const fundAmount = parseEther("1") // 1 ether，mock 中实际上消耗的是 link
  const subscription = m.call(VRFMock,"createSubscription")
  const subId = m.readEventArgument(subscription, "SubscriptionCreated","subId")
  m.call(VRFMock, "fundSubscription", [subId, fundAmount])

  // 部署 Consumer
  const keyHash = "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc" // 随意，mock 中没用
  const consumer = m.contract("RandomConsumer", [subId, VRFMock, keyHash])

  // 添加 consumer 到订阅中
  m.call(VRFMock, "addConsumer", [subId, consumer])

  return { consumer, VRFMock }
})

export default VRFModule
