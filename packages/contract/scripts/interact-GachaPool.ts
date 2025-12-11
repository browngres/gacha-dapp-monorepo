import { network } from "hardhat"
const { ethers } = await network.connect()

async function main() {
  // 部署
  const gachaPool = await ethers.getContractAt("GachaPool", "0xC3DAD685922ef673eb81E7920Eff646F70BF54C1")
  const vrf = await ethers.getContractAt("VRFCoordinatorV2_5Mock", "0x76bdD8D6c93D0d41fEf61bf43760fCC592A06366")
  await gachaPool.requestRandomWords()

  // console.log("requestId:", requestId)

  // 查看当前订阅
  const ids = await vrf.getActiveSubscriptionIds(0, 10)
  console.log("subIds:", ids)

  // gachaPool 实际上是第二个 consumer。第一个 consumer 是部署 VRF 带的一个。
  const sub = await vrf.getSubscription(ids[1])
  // console.log("sub:", sub);

  const balance = ethers.formatEther(sub[0])
  console.log("balance", balance)

  // mock 任意充值，单位是 LINK，nonpayable
  // 每次消耗 0.35 左右
  await vrf.fundSubscription(ids[1], ethers.parseEther("100"))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
