import { parseEther } from "ethers"
import { network } from "hardhat"
const { ethers } = await network.connect()

async function main() {
  const gachaPool = await ethers.getContractAt("GachaPool", "0xD6fB9d5EA5A958180f5881e6083ac2738aCa5DEd")
  const vrf = await ethers.getContractAt("VRFCoordinatorV2_5Mock", "0x589B0D7C9A2Fb128B49d056b603Da5b982387312")

  // await gachaPool.pause()
  // await gachaPool.setPercentage([20,20,10,30,20])

  // 查看当前订阅
  const ids = await vrf.getActiveSubscriptionIds(0, 10)
  console.log("subIds:", ids)

  // const sub = await vrf.getSubscription(ids[1])
  // console.log("sub:", sub);

  // const balance = ethers.formatEther(sub[0])
  // console.log("balance", balance)

  // mock 任意充值，单位是 LINK，nonpayable
  // 每次消耗 0.35 左右
  // await vrf.fundSubscription(ids[1], ethers.parseEther("100"))

  /*
  const gachaTime = async (): Promise<bigint> => {
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

  const reqId = await gachaTime()
  console.log(reqId)
  */

  // 查看 NFT 地址
  console.log("GACHA_CARD_NFT ", await gachaPool.GACHA_CARD_NFT())
  // 设置 NFT URI
  await gachaPool.setNftUri("http://127.0.0.1:3000/nft/", "http://127.0.0.1:3000/nft/contract-metadata.json")
  // await gachaPool.setNftUri("https://www.miladymaker.net/milady/json/","https://example.com/")

  // 给出指定的随机数

  // await vrf.fulfillRandomWordsWithOverride(reqId, gachaPool.target, [99999n])
  // const tx = await vrf.fulfillRandomWordsWithOverride(1n, gachaPool.target, [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 99n, 99n]  )
  // const tx = await vrf.fulfillRandomWordsWithOverride(reqId, gachaPool.target, [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 99n, 99n]  )
  // console.log(tx);

  // const txReceipt = await tx.wait()
  // console.log(txReceipt);

  // console.log(await gachaPool.getResult(reqId));
  // console.log(await gachaPool.getResult(183n))


  // GachaPool 部署 NFT
  // const tx2 = await gachaPool.deployGachaCardNFT("GachaCard","GC", "http://127.0.0.1/nft/","http://127.0.0.1/nft/contract-metadata.json")
  // await tx2.wait();

  // 检查合约的余额
  // console.log("GachaPool 余额", await ethers.provider.getBalance(gachaPool.target));
  // await gachaPool.withdraw()
  //

  // await gachaPool.claim(1n,"0x")
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
