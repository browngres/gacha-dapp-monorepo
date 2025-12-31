import { publicClient } from "@/common/config"
import { ABI, CA } from "@/public/GachaCardContract"
import { RARITY } from "@/public/GachaPoolContract"
import { parseEventLogs } from "viem"
import { join } from "path"
import { existsSync } from "fs"

async function fetchRarities(ids: readonly bigint[]): Promise<readonly number[]> {
  const results = await Promise.all(
    ids.map(async (id) => {
      // 批量 readContract
      const rarity = await publicClient.readContract({
        address: CA,
        abi: ABI,
        functionName: "getRarity" as const,
        args: [id],
      })
      return rarity
    }),
  )
  return results // 顺序与 ids 保持一致
}

type NFTItem = { id: bigint; rarity: string }

export default async function generateMetadata(txHash: `0x${string}`): Promise<number> {
  // 读取 tx 信息
  const [txReceipt, confirmations] = await Promise.all([
    publicClient.getTransactionReceipt({ hash: txHash }),
    publicClient.getTransactionConfirmations({ hash: txHash }),
  ])

  if (confirmations < 1) {
    throw new Error("Invalid TxHash.")
  }

  // 一个或十个
  const transferLogs = parseEventLogs({
    abi: ABI,
    logs: txReceipt.logs,
    args: {
      from: "0x0000000000000000000000000000000000000000",
    },
  })

  if (transferLogs.length < 1) {
    throw new Error("Invalid TxHash.")
  }

  // 构建一个 NFTItem 对象数组
  const ids: bigint[] = transferLogs.map((log) => log.args.id)
  console.log("ids", ids)
  const rarityData = await fetchRarities(ids)
  console.log("rarityData, rarityData")
  const nfts: NFTItem[] = ids.map((id, i) => ({ id: ids[i]!, rarity: RARITY[rarityData[i] as number]! }))
  console.log("nfts", nfts)

  const jsonPath = join(import.meta.dir, "./nft/json")
  console.log("jsonPath", jsonPath)

  // TODO 读取模板
  for (const nft of nfts) {
    // 如果已经存在，跳过
    if (existsSync(join(jsonPath, `${nft.id}.json`))) break
    // TODO 按照模板生成 json
    // TODO 按照模板复制一份 png
  }
  return ids.length
}

await generateMetadata("0x076bee10dc5848c1f86e4241b9bc03ee786c0c2c324d754769110f3b995796d5")
