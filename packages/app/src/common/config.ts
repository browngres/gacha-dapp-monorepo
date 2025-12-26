import { defineChain, http, createWalletClient, createPublicClient } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { createConfig } from "wagmi"

const ganache_test = defineChain({
  id: 1337,
  name: "Ganache test",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [process.env.GANACHE_RPC_TEST!],
      // webSocket: [''],
    },
  },
})

/*
const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [rainbowWallet],
    },
  ],
  {
    appName: "Gacha App",
    projectId: "YOUR_PROJECT_ID",
  },
);
*/

// wagmi config for frontend
export const config = createConfig({
  chains: [ganache_test],
  // 不指定 connectors 的话，自动检测已经安装的钱包
  // connectors: connectors,
  ssr: true, // If your dApp uses server side rendering (SSR)
  transports: { [ganache_test.id]: http() },
})

declare module "wagmi" {
  interface Register {
    config: typeof config
  }
}

// viem client (similar to ethers provider) for backend

const GANACHE_RPC_TEST_KEY_0 = process.env.GANACHE_RPC_TEST_KEY_0! as `0x${string}`
const account = privateKeyToAccount(GANACHE_RPC_TEST_KEY_0)

export const publicClient = createPublicClient({
  key: "publicClient",
  name: "Public Client",
  chain: ganache_test,
  transport: http(),
})

export const signGachaClient = createWalletClient({
  key: "signGachaClient",
  name: "signGacha Wallet Client",
  account: account,
  chain: ganache_test,
  pollingInterval: 3_000,
  transport: http(),
})
