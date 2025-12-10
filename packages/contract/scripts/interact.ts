import { network } from "hardhat"
const { ethers } = await network.connect()

async function main() {
  // 部署
  const consumer = await ethers.getContractAt("RandomConsumer", "0xF682a44E6a46865F92803A3c7710AA78e9E9bD02")
  const vrf = await ethers.getContractAt("VRFCoordinatorV2_5Mock", "0x76bdD8D6c93D0d41fEf61bf43760fCC592A06366")
  await consumer.requestRandomWords()
  const requestId = await consumer.s_requestId()
  console.log("requestId:", requestId)

  // 查看当前订阅
  const ids = await vrf.getActiveSubscriptionIds(0, 10)
  console.log("subIds:", ids)

  const sub = await vrf.getSubscription(ids[0])
  // console.log("sub:", sub);

  const balance = ethers.formatEther(sub[0])
  console.log("balance", balance)

  // mock 任意充值，单位是 LINK，nonpayable
  // 每次消耗 0.35 左右
  await vrf.fundSubscription(ids[0], ethers.parseEther("100"))

  // 自动生成
  // const tx = await vrf.fulfillRandomWords(requestId, consumer.target)

  // 手动生成
  // 合约中设置请求2个，所以这里要生成2个
  // prettier-ignore
  const tx = await vrf.fulfillRandomWordsWithOverride(requestId, consumer.target, [
    BigInt(666666),
    BigInt(88888888)
  ])

  // const txReceipt = await tx.wait()
  // console.log(txReceipt!.logs[1].topics)

  const firstRandomNumber = await consumer.s_randomWords(0)
  const secondRandomNumber = await consumer.s_randomWords(1)

  console.log("firstRandomNumber:", firstRandomNumber)
  console.log("secondRandomNumber:", secondRandomNumber)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
