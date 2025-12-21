import { defineChain, http } from "viem"
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
