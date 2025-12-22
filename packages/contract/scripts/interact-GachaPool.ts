import { parseEther } from "ethers"
import { network } from "hardhat"
const { ethers } = await network.connect()

async function main() {

  const gachaPool = await ethers.getContractAt("GachaPool", "0x016286aA4713791e3FBd79e2D412897d81103ea8")
  const vrf = await ethers.getContractAt("VRFCoordinatorV2_5Mock", "0x70e0C7a7b38d1185D468d316dFDd3e37A8AC5f93")

  // await gachaPool.pause()
  // await gachaPool.setPercentage([20,20,10,30,20])


  // 查看当前订阅
  const ids = await vrf.getActiveSubscriptionIds(0, 10)
  console.log("subIds:", ids)

  // gachaPool 实际上是第二个 consumer。第一个 consumer 是部署 VRF 带的一个。
  const sub = await vrf.getSubscription(ids[1])
  // // console.log("sub:", sub);

  const balance = ethers.formatEther(sub[0])
  // console.log("balance", balance)

  // mock 任意充值，单位是 LINK，nonpayable
  // 每次消耗 0.35 左右
  // await vrf.fundSubscription(ids[1], ethers.parseEther("100"))

  const gachaOneTime = async (): Promise<bigint> => {
    // 发起一次请求，返回 reqId
    return new Promise<bigint>((resolve, reject) => {
      // 防止永远等不到事件（超时 3 秒）
      const timer = setTimeout(() => {
        reject(new Error("Timeout waiting for RandomRequested"))
      }, 3000)
      // 监听请求事件(这里也可以监听 VRF 的)
      gachaPool.once(gachaPool.getEvent("RandomRequested"), (requestId) => {
        clearTimeout(timer) // 清除超时
        resolve(requestId) // 返回 reqId
      })
      gachaPool.gachaOne({value: parseEther("0.1")})
    })
  }


  const reqId = await gachaOneTime()
  console.log(reqId);

  // 给出指定的随机数
  await vrf.fulfillRandomWordsWithOverride(reqId, gachaPool.target, [99999n])
  // await vrf.fulfillRandomWordsWithOverride(reqId, gachaPool.target, [99999n])
  // console.log(tx);

  // const txReceipt = await tx.wait()
  // console.log(txReceipt);
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
