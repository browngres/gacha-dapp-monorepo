import { randomBytes } from "crypto"
import { type ContractTransactionResponse, ethers } from "ethers"

// 不应该使用 hardhat 的 ethers，因为 feedVRF 是应该独立于 hardhat 工作的
async function main() {
  // provider
  const RPC = process.env.GANACHE_RPC_TEST
  if (!RPC) {
    throw new Error("没有从 env 读取到 RPC，检查命令工作目录")
  }
  const provider = new ethers.JsonRpcProvider(RPC)
  provider.pollingInterval = 5000 // 设置轮询间隔

  // 钱包
  const feeder = new ethers.Wallet(process.env.GANACHE_RPC_TEST_KEY_0!, provider)

  // chain
  const chain = await provider.getNetwork()
  const blockNumber = await provider.getBlockNumber()
  console.log(`Current chain: ${chain.name} (id: ${chain.chainId})`)
  console.log(`Current block number: ${blockNumber}`)

  let VRF_CA = process.env.VRF_CA || ""
  if (!VRF_CA || !ethers.isAddress(VRF_CA)) {
    console.log("VRF Address: ", VRF_CA)
    throw new Error("VRF_CA 为空 或 异常")
  }

  // 只写要用到的
  const abi = [
    "function fulfillRandomWordsWithOverride(uint256 _requestId, address _consumer, uint256[] memory _words) public",
    "event RandomWordsRequested(bytes32 indexed keyHash, uint256 requestId, uint256 preSeed, uint256 indexed subId, uint16 minimumRequestConfirmations, uint32 callbackGasLimit, uint32 numWords, bytes extraArgs, address indexed sender)",
  ]

  let VRF = new ethers.Contract(VRF_CA, abi, feeder)

  console.log("Listening embarked...")

  // 监听事件
  VRF.on(
    VRF.getEvent("RandomWordsRequested"),
    async (
      _keyHash,
      requestId,
      _preSeed,
      _subId,
      _minimumRequestConfirmations,
      callbackGasLimit,
      numWords,
      _extraArgs,
      sender,
    ) => {
      console.info("VRF got a random request")
      console.info("callbackGasLimit", callbackGasLimit)
      console.info("requestId:", requestId)
      console.info("numWords:", numWords)
      console.info("consumer:", sender)

      // 生成随机数
      const randomWords: bigint[] = Array.from(new Array(Number(numWords)), () => {
        return BigInt("0x" + randomBytes(32).toString("hex"))
      })

      const tx: ContractTransactionResponse = await VRF.fulfillRandomWordsWithOverride(requestId, sender, randomWords)
      const txReceipt = await tx.wait()
      console.info("Random fulfilled at block: ", txReceipt?.blockNumber)
    },
  )

  // Ctrl+C exit
  process.on("SIGINT", () => {
    console.log("Ctrl-C was pressed. Now stop.")
    process.exit()
  })

  // heartbeat
  while (1) {
    const now = new Date()
    console.log(now.toLocaleString(), "heartbeat")
    await Bun.sleep(10000)
  }
}
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
