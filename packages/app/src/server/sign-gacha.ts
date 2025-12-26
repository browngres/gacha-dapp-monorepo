import { publicClient, signGachaClient } from "@/common/config"
import {
  encodePacked,
  isAddressEqual,
  // hashMessage,
  keccak256,
  parseEventLogs,
  // recoverMessageAddress,
} from "viem"
import type { Address, Hash, Hex } from "viem"
import { ABI, CA } from "@/public/GachaPoolContract"

export default async function signGacha(txHash: Hash): Promise<{ requestId: bigint; who: Address; signature: Hex }> {
  const invalidReturn = { requestId: 0n, who: "0x" as `0x${string}`, signature: "0x" as `0x${string}` }

  let signature: Hex

  // 读取 tx 信息
  const [txReceipt, confirmations] = await Promise.all([
    publicClient.getTransactionReceipt({ hash: txHash }),
    publicClient.getTransactionConfirmations({ hash: txHash }),
  ])

  if (confirmations < 1) return invalidReturn

  const logs = parseEventLogs({
    abi: ABI,
    logs: [txReceipt.logs[2]!], // GachaOne/GachaTen 是第三个 Log
  })

  // 要么是 GachaOne 要么是 GachaTen
  if (!["GachaOne", "GachaTen"].includes(logs[0]!.eventName.toString())) return invalidReturn
  // 读取 Event 参数
  const { who, requestId } = logs[0]!.args as { who: `0x${string}`; requestId: bigint }

  if (!isAddressEqual(who, txReceipt.from)) return invalidReturn // 正常不可能出现

  // 签名(requestId + 用户地址 + 合约地址)
  // 170 0xca9Fb58FB299d92C3c3353940faFF30f4d79217d  0x016286aA4713791e3FBd79e2D412897d81103ea8
  const msgHash = keccak256(encodePacked(["uint256", "address", "address"], [requestId, who, CA]))
  // console.log("msgHash", msgHash)
  // const ethMsgHash = hashMessage({raw:msgHash})
  // console.log("ethMsgHash", ethMsgHash)
  signature = await signGachaClient.signMessage({
    message: { raw: msgHash },
  })

  return { requestId, who, signature }
}
