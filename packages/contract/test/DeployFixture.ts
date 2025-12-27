import { network } from "hardhat"
import type { GachaPool } from "../types/ethers-contracts/index.js"

export async function deployVRFMockFixture() {
  const { ethers } = await network.connect()
  // 部署 VRFCoordinator
  const BASE_FEE = ethers.parseEther("0.001")
  const GAS_PRICE = ethers.parseUnits("5", "gwei") // 5 gwei
  const WEI_PER_UNIT_LINK = ethers.parseEther("0.005") // 0.005 ether = 1 LINK

  const VRFCoordinatorMock = await ethers.deployContract("VRFCoordinatorV2_5Mock", [
    BASE_FEE,
    GAS_PRICE,
    WEI_PER_UNIT_LINK,
  ])

  console.log("🚀 VRFCoordinatorMock address:", VRFCoordinatorMock.target)

  // 存款并订阅
  const fundAmount = ethers.parseEther("100") // 100 LINK
  const tx = await VRFCoordinatorMock.createSubscription()
  const txReceipt = await tx.wait()
  const subscriptionId = BigInt(txReceipt!.logs[0].topics[1])
  await VRFCoordinatorMock.fundSubscription(subscriptionId, fundAmount)

  return { ethers, subscriptionId, VRFCoordinatorMock }
}

export async function deployGachaPoolFixture() {
  // 嵌套了 fixture，这里不能重新连接一个 ethers，否则状态会消失。导致部署合约地址重叠
  const { networkHelpers } = await network.connect()
  const {
    ethers,
    subscriptionId: subId,
    VRFCoordinatorMock: vrf,
  } = await networkHelpers.loadFixture(deployVRFMockFixture)

  // 部署 GachaPool 实现和 Beacon
  const [deployer] = await ethers.getSigners()
  console.log("🚀 Deploying GachaPool with account:", deployer.address)
  const gachaPool = await ethers.deployContract("GachaPool", [], deployer)
  const beacon = await ethers.deployContract("UpgradeableBeacon", [gachaPool, deployer], deployer)
  console.log("🚀 GachaPool impl address:", gachaPool.target)
  console.log("🚀 GachaPool beacon address:", beacon.target)

  // 准备参数
  const keyHash = "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc" // 随意，mock 中没用
  const defaultConfig: GachaPool.PoolConfigStruct = {
    poolId: 1,
    supply: 100,
    costGwei: ethers.parseUnits("0.1", "gwei"), // 单次费用 0.1 ether，转换为 gwei
    discountGachaTen: 90, // 9折
    guarantee: true,
    guaranteeRarity: 1,
    percentages: [2, 8, 10, 20, 60],
  }

  const initCallData = gachaPool.interface.encodeFunctionData("initialize", [
    subId,
    vrf.target,
    keyHash,
    deployer.address,
    deployer.address, // signer
    defaultConfig,
  ])

  // 部署 proxy
  const _proxy = await ethers.deployContract("BeaconProxy", [beacon, initCallData])
  console.log("🚀 GachaPool proxy address:", _proxy.target)

  // 将 GachaPool 作为 consumer 添加到订阅中
  await vrf.addConsumer(subId, _proxy.target)

  // 将实现的 ABI 加载到代理上
  const proxy = await ethers.getContractAt("GachaPool", _proxy.target)

  // 返回 VRFMock, subId, gachaPool 的实现、信标、代理。
  return { vrf, subId, gachaPool, beacon, proxy }
}

export default { deployVRFMockFixture, deployGachaPoolFixture }
