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

