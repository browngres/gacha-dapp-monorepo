import { serve } from "bun"
import { Database } from "bun:sqlite"

import index from "../public/index.html"
import signGacha from "./sign-gacha"
import { publicClient } from "@/common/config"
import { ABI, CA } from "@/public/GachaPoolContract"
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
        if (!txHash) {
          return Response.json({ error: "No txHash" }, { status: 400 })
        }
        const [_, poolId] = await publicClient.readContract({
          address: CA,
          abi: ABI,
          functionName: "getPoolConfig",
        })
        if (BigInt(pool) != BigInt(poolId)) {
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
            .query("INSERT INTO requests (poolId, address, requestId, signature) VALUES (?, ?, ?, ?) RETURNING *")
            .get(poolId, who, requestId, signature)

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
