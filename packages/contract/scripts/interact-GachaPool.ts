import { parseEther } from "ethers"
import { network } from "hardhat"
const { ethers } = await network.connect()

async function main() {
  const gachaPool = await ethers.getContractAt("GachaPool", "0x402EF2428C40e7009D39E205450f422c519dfF51")
  const vrf = await ethers.getContractAt("VRFCoordinatorV2_5Mock", "0x70e0C7a7b38d1185D468d316dFDd3e37A8AC5f93")

  // await gachaPool.pause()
  // await gachaPool.setPercentage([20,20,10,30,20])

  // 查看当前订阅
  const ids = await vrf.getActiveSubscriptionIds(0, 10)
  console.log("subIds:", ids)

  // gachaPool 实际上是第二个 consumer。第一个 consumer 是部署 VRF 带的一个。
  const sub = await vrf.getSubscription(ids[1])
  // console.log("sub:", sub);

  const balance = ethers.formatEther(sub[0])
  // console.log("balance", balance)

  // mock 任意充值，单位是 LINK，nonpayable
  // 每次消耗 0.35 左右
  // await vrf.fundSubscription(ids[1], ethers.parseEther("100"))

  /*
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
      // gachaPool.gachaOne({value: parseEther("0.1")})
      gachaPool.gachaTen({ value: parseEther("0.91") })
    })
  }

  const reqId = await gachaOneTime()
  console.log(reqId)
  */

  // 给出指定的随机数

  // await vrf.fulfillRandomWordsWithOverride(reqId, gachaPool.target, [99999n])
  // const tx = await vrf.fulfillRandomWordsWithOverride(180n, gachaPool.target, [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 100n]  )
  // console.log(tx);

  // const txReceipt = await tx.wait()
  // console.log(txReceipt);

  // console.log(await gachaPool.getResult(reqId));
  // console.log(await gachaPool.getResult(183n))

  // 向合约转账

  const GANACHE_RPC_TEST_KEY_0 = process.env.GANACHE_RPC_TEST_KEY_0
  const wallet0 = new ethers.Wallet(GANACHE_RPC_TEST_KEY_0!, ethers.provider)
  console.log(wallet0.address);

  const tx1 = await wallet0.sendTransaction({
    to: gachaPool.target,
    value: parseEther("1.0")
  });
  await tx1.wait();

  // GachaPool 部署 NFT
  // const tx2 = await gachaPool.deployGachaCardNFT("GachaCard","GC", "http://127.0.0.1/nft/","http://127.0.0.1/nft/contract-metadata.json")
  // await tx2.wait();

  // 检查合约的余额
  console.log("GachaPool 余额", await ethers.provider.getBalance(gachaPool.target));

}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
