import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import { parseEther, parseUnits } from "ethers"

// 部署 VRF Coordinator Mock，不带 consumer（GachaPool 本身是 consumer）

const VRFModule = buildModule("VRFModule", (m) => {
  // 准备参数
  const BASE_FEE = parseEther("0.001") // 0.001 ether as base fee
  const GAS_PRICE = parseUnits("5", "gwei") // 5 gwei
  const WEI_PER_UNIT_LINK = parseEther("0.005") // 0.005 ether = 1 LINK
  const VRFMock = m.contract("VRFCoordinatorV2_5Mock", [BASE_FEE, GAS_PRICE, WEI_PER_UNIT_LINK])
  return { VRFMock }
})

export default VRFModule
