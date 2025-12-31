import { serve } from "bun"
import { Database } from "bun:sqlite"
import { join } from "path"
import index from "../public/index.html"
import signGacha from "./sign-gacha"
import { publicClient } from "@/common/config"
import { ABI, CA } from "@/public/GachaPoolContract"
import { isAddress } from "viem"
import generateMetadata from "./generate-metadata"
// TODO logger

// Initialize database
const db = new Database("db/GachaApp.db", { create: true, safeIntegers: true })
db.run(`
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address CHAR(42) NOT NULL,
    poolId INTEGER NOT NULL CHECK(poolId > 0),
    requestId TEXT NOT NULL CHECK(requestId > 0),
    signature CHAR(132) NOT NULL,
    claimed INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poolId, address, requestId)
  )
`)

const SIGNER_KEY = process.env.GANACHE_RPC_TEST_KEY_0 || ""
if (!SIGNER_KEY) {
  throw new Error("SIGNER_KEY is empty")
}

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/gacha/": {
      async POST(req) {
        console.log("得到一次请求")
        // 对接前端的 gacha-step-two，签名并返回
        // 前端提供 tx，后端从链上获得信息。防止没抽过就请求签名。
        const { pool, txHash } = await req.json()
        if (!txHash || !pool) {
          return Response.json({ error: "No txHash or poolId" }, { status: 400 })
        }
        const [_, poolId] = await publicClient.readContract({
          address: CA,
          abi: ABI,
          functionName: "getPoolConfig",
        })
        if (BigInt(pool | 0) != BigInt(poolId)) {
          return Response.json({ error: "Wrong poolId" }, { status: 400 })
        }
        // 消息签名
        await Bun.sleep(1000) // 模拟用时
        const { requestId, who, signature } = await signGacha(txHash)
        // 如果根据 txHash 找不到链上信息
        if (!requestId) {
          return Response.json({ error: "Invalid txHash or RPC Error" }, { status: 400 })
        }

        try {
          const result = db
            .query(
              "INSERT INTO requests (poolId, address, requestId, signature, claimed) VALUES (?, ?, ?, ?,? ) RETURNING *",
            )
            .get(poolId, who, requestId, signature, 0)

          return Response.json(
            {
              status: "ok",
              data: {
                signature: signature,
              },
              timestamp: new Date().toISOString(),
            },
            { status: 201 },
          )
        } catch (error) {
          console.error(error)
          return Response.json({ error: "Database Error. Maybe data already exists." }, { status: 400 })
        }
      },
    },

    "/api/claimed/:address": {
      // 获取地址已经 claimed 的 reqId
      async GET(req) {
        const { address } = req.params
        if (!isAddress(address)) {
          return Response.json({ error: "Invalid address" }, { status: 400 })
        }
        await Bun.sleep(1000) // 模拟用时
        // 由于开启了 safeIntegers, 所有数字类型使用 bigint
        const claimed = db.query("SELECT requestId FROM requests WHERE address = ? AND claimed = ?").all(address, 1n)
        // console.log("后端查到的:", claimed);  // 列表
        return Response.json(claimed)
      },
    },

    "/api/claimed/": {
      async PUT(req) {
        // TODO 检查 txHash， reqId 对不对， address 对不对
        // 将 reqId 的 claimed 设置为 true
        console.log("得到一次 PUT claimed 请求")
        const { address, requestId, txHash } = await req.json()

        const result = db
          .query("UPDATE requests SET claimed = 1 WHERE requestId = ? AND address = ? RETURNING *")
          .get(requestId, address)
        console.log("put claim result", result)

        return Response.json(
          {
            status: "ok",
            timestamp: new Date().toISOString(),
          },
          { status: 202 },
        )
      },
    },

    "/api/mint/": {
      async POST(req) {
        // 检查 txHash 生成 NFT metadata
        console.log("得到一次 POST mint 请求")
        const { txHash } = await req.json()

        if (!txHash) {
          return Response.json({ error: "No txHash" }, { status: 400 })
        }

        let count = 0
        try {
          count = await generateMetadata(txHash)
        } catch (error) {
          return Response.json({ error: error }, { status: 400 })
        }
        return Response.json(
          {
            status: "ok",
            data: count,
            timestamp: new Date().toISOString(),
          },
          { status: 201 },
        )
      },
    },

    "/api/signature/:poolId/:requestId/:address": {
      async GET(req) {
        // 查询 reqId 对应的签名
        const { poolId, requestId, address } = req.params
        const result = db
          .query("SELECT signature FROM requests WHERE address = ? AND poolId = ? AND requestId = ?")
          .get(address, poolId, requestId)
        return Response.json(
          {
            status: "ok",
            data: result,
            timestamp: new Date().toISOString(),
          },
          { status: 200 },
        )
      },
    },

    "/nft/img/*.png": {
      async GET(req) {
        // 获取 NFT png
        console.log("得到一次 GET nft/img/*.png 请求")
        const path = new URL(req.url)
        console.log(path.pathname);
        const id = path.pathname.split('/').pop()?.replace('.png', ''); // 从 url 中取出 id
        console.log(id);

        const nftPngPath = join(import.meta.dir, `./nft/png/${id}.png`)
        const file = Bun.file(nftPngPath);
        if (!(await file.exists())) {
          return Response.json({ error: "Invalid token Id" }, { status: 400 })
        }
        return new Response(await file.bytes());
      },
    },

    "/nft/:id": {
      async GET(req) {
        // 获取 NFT metadata json
        console.log("得到一次 GET /nft/:id 请求")
        const {id} = req.params
        const nftJsonPath = join(import.meta.dir, `./nft/json/${id}.json`)
        const file = Bun.file(nftJsonPath)

        if (!(await file.exists())) {
          return Response.json({ error: "Invalid token Id" }, { status: 400 })
        }
        return Response.json(await file.json())
      },
    },

    // Health check endpoint
    "/api/health": {
      GET() {
        return Response.json({
          status: "ok",
          timestamp: new Date().toISOString(),
        })
      },
    },

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        })
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        })
      },
    },

    "/api/hello/:name": async (req) => {
      const name = req.params.name
      return Response.json({
        message: `Hello, ${name}!`,
      })
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
})

console.log(`🚀 Server running at ${server.url}`)
