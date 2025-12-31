import { join } from "path"
import { existsSync, copyFile, writeFile } from "fs"
import { parseEventLogs } from "viem"
import { publicClient } from "@/common/config"
import { ABI, CA } from "@/public/GachaCardContract"
import { RARITY } from "@/public/GachaPoolContract"
import TEMPLATE from "./nft/assets/template.json"
import ALL_CARDS from "./nft/assets/card.yaml"

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
  // console.log("ids", ids)
  const rarityData = await fetchRarities(ids)
  // console.log("rarityData, rarityData")
  const nfts: NFTItem[] = ids.map((id, i) => ({ id: ids[i]!, rarity: RARITY[rarityData[i] as number]! }))
  // console.log("nfts", nfts)

  const jsonPath = join(import.meta.dir, "./nft/json")
  const pngPath = join(import.meta.dir, "./nft/png")
  const allPngPath = join(import.meta.dir, "./nft/assets/png")
  // console.log("jsonPath", jsonPath)

  const NFT_BASE_URI = process.env.NFT_BASE_URI || "https://example.com/nft/"

  for (const nft of nfts) {
    // 如果已经存在，跳过
    const nftJsonPath = join(jsonPath, `${nft.id}.json`)
    if (existsSync(nftJsonPath)) break

    // 从指定的稀有度随机选一个
    const rarityCard = ALL_CARDS[nft.rarity]
    const choice = rarityCard[Math.floor(Math.random() * rarityCard.length)]
    // console.log("choice", choice)

    // 按照模板生成 metadata json
    const NftJson = TEMPLATE
    NftJson.name = choice.name // name
    NftJson.description = choice.description //description
    NftJson.image = NFT_BASE_URI + nft.id + ".png" // 图片 url
    NftJson.external_url = NFT_BASE_URI + nft.id // 以合约的返回为准，没有 ".json" 后缀
    NftJson.attributes[0]!.value = choice.attributes.waifu // Waifu
    NftJson.attributes[1]!.value = choice.attributes.color // Color
    NftJson.attributes[2]!.value = nft.rarity // Rarity
    // console.log("NftJson to write", NftJson)

    // 写入 json 文件
    writeFile(nftJsonPath, JSON.stringify(NftJson, null, 2), "utf-8", (err) => {
      if (err) {
        console.error(`写入${nftJsonPath}失败:`, err)
      } else {
        console.log(`成功生成文件: ${nftJsonPath}`)
      }
    })

    // 复制 png 文件
    const choicePngPath = join(allPngPath, choice.png_file) // 从 card 列表中读取对应的 png 文件名
    const nftPngPath = join(pngPath, `${nft.id}.png`)
    copyFile(choicePngPath, nftPngPath, (err) => {
      if (err) {
        console.error(`写入${nftPngPath}失败:`, err)
      } else {
        console.log(`成功复制文件: src ${choicePngPath} desc ${nftPngPath}`)
      }
    })
  }
  return ids.length
}
