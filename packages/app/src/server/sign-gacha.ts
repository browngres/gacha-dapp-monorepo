import { publicClient, signGachaClient } from "@/common/config"
import {
  encodePacked,
  getAddress,
  // hashMessage,
  keccak256,
  parseEventLogs,
  // recoverMessageAddress,
} from "viem"
import type { Hash, Hex } from "viem"
import { ABI, CA } from "@/public/GachaPoolContract"

export default async function signGacha(txHash: Hash): Promise<Hex> {
  let signature: Hex

  // 读取 tx 信息
  const [txReceipt, confirmations] = await Promise.all([
    publicClient.getTransactionReceipt({ hash }),
    publicClient.getTransactionConfirmations({ hash }),
  ])

  if (confirmations < 1) return "0x"

  const logs = parseEventLogs({
    abi: ABI,
    logs: [txReceipt.logs[2]!], // GachaOne 是第三个 Log
  })

  if (logs[0]?.eventName != "GachaOne") return "0x"
  const { who, requestId } = logs[0].args

  if (getAddress(who) != getAddress(txReceipt.from)) return "0x" // 正常不可能出现

  // 签名(requestId + 用户地址 + 合约地址)
  // 170 0xca9Fb58FB299d92C3c3353940faFF30f4d79217d  0x016286aA4713791e3FBd79e2D412897d81103ea8
  const msgHash = keccak256(encodePacked(["uint256", "address", "address"], [requestId, who, CA]))
  // console.log("msgHash", msgHash)
  // const ethMsgHash = hashMessage({raw:msgHash})
  // console.log("ethMsgHash", ethMsgHash)
  signature = await signGachaClient.signMessage({
    message: { raw: msgHash },
  })
  return signature
}

const hash = "0x33479623a02d7e33cb23f47e9e7930322e0e23750b45a41e4e15b64c2f3568dc"
console.log("signature", await signGacha(hash))
