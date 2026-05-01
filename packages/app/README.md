# Gacha DApp 前后端

This project was created using `bun init` in bun v1.3.1. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

To install dependencies:

```bash
bun install
```

To start a development server:

```bash
bun dev
```

---

## 核心文件

```
packages/app/
├── db/
│   └── GachaApp.db              # 后端 db
├── src/
│   ├── server/                  # 后端
│   │   ├── index.ts             # 后端入口（API 和静态文件服务）
│   │   ├── sign-gacha.ts        # 签名逻辑
│   │   ├── nft/asset            # NFT 静态文件、定义、模板
│   │   └── generate-metadata.ts # NFT metadata 生成
│   │
│   ├── common/
│   │   └── config.ts            # wagmi 配置
│   │
│   ├── components/              # 前端 React 组件
│   │   ├── gachaTab.tsx         # 抽卡页面
│   │   ├── claimTab.tsx         # 领取页面
│   │   ├── mineTab.tsx          # 我的 NFT 页面
│   │   ├── gacha-step-*.tsx     # 抽卡步骤组件（1-4）
│   │   ├── claimForm.tsx        # 领取表单
│   │   ├── send-tx.tsx          # 发送交易组件
│   │   ├── read-gacha.tsx       # 读取合约信息
│   │   └── APITester.tsx        # bun 自带 API 测试工具
│   │
│   ├── public/
│   │   ├── index.html           # 前端 html 入口
│   │   ├── GachaPoolContract.ts # 合约 ABI 和地址
│   │   └── GachaCardContract.ts # NFT 合约 ABI 和地址
│   │
│   ├── App.tsx                  # React root
│   └── frontend.tsx             # 前端入口（React + Tailwind）
│
├── empty-replace/               # （某些依赖的空替换）
└── .env                         # 环境变量
```

## 接口说明

#prettierignore
| 端点 | 功能 | 方法 | 参数 |
|------|------|------|------|
| `/api/gacha/` | 签名抽奖请求：接收 `txHash` 和 `pool`，验证是否与链上配置一致，对交易哈希进行签名并记录到数据库。 | POST | **body (JSON):** `pool` (number) – 抽奖池 ID；`txHash` (string) – 链上交易哈希 |
| `/api/claimed/:address` | 查询指定地址已领取（claimed）的 requestId 列表。 | GET | **路径参数:** `address` (string) – 地址（会被校验是否为合法地址） |
| `/api/claimed/` | 将某个请求标记为已领取（claimed）。更新数据库中对应 `requestId` 和 `address` 的 `claimed` 字段为 1。 | PUT | **body (JSON):** `address` (string) – 用户地址；`requestId` (string) – 请求 ID；`txHash` (string) – 交易哈希 |
| `/api/mint/` | 根据交易哈希（`txHash`）生成 NFT 元数据（调用 `generateMetadata`），返回生成的数量。 | POST | **body (JSON):** `txHash` (string) – 链上交易哈希 |
| `/api/signature/:poolId/:requestId/:address` | 获取指定池、请求ID、地址对应的签名（signature）。 | GET | **路径参数:** `poolId` (number) – 池 ID；`requestId` (string) – 请求 ID；`address` (string) – 用户地址 |
| `/nft/img/*.png` | 获取 NFT 图片（PNG 格式），路径中最后一段为 token ID（如 `/nft/img/123.png`）。 | GET | **路径参数:** 从 URL 最后一部分提取 token ID（去掉 `.png`） |
| `/nft/:id` | 获取 NFT 元数据 JSON 文件（如 `/nft/123` 对应 `./nft/json/123.json`）。 | GET | **路径参数:** `id` (string) – token ID |

## NFT meta 生成流程

`ClaimForm` 组件中，`ClaimTxReceipt` 成功后，也就是领取成功后自动调用 `postMint`。这个函数会像后端`/api/mint/`接口发出请求，让后端生成 nft 的 json 等文件。核心是调用 `generate-metadata.ts` 中的 `generateMetadata` 方法来生成文件。

给出 txHash，读取链上 Log，获取 nft 的 id 和稀有度。根据稀有度从预设的 `card.yaml` 中随机挑选一套信息。然后填充 json 模板。复制图片。

card.yaml 中就是预设的 nft 信息。例如：

```yaml
UR:
  - name: 星空凛
    description: ねずみ担当だから
    png_file: UR-001.png
    attributes:
      waifu: Rin
      color: Pink
```

其中 `png_file` 字段定义了图片名(位于`packages\app\src\server\nft\assets\png\xxx.jpg`)。

生成时会用这个图片，复制一份(`packages\app\src\server\nft\png\<nft_id>.png`)来作为对应 id 的 nft 的图片。 其他字段可随意设置，只会影响 json 填充。
