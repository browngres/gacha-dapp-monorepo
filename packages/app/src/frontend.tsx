import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// Rainbowkit 相关
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, WagmiProvider, http } from "wagmi";
import { RainbowKitProvider, connectorsForWallets } from "@rainbow-me/rainbowkit";
// import { rainbowWallet, metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";

import { defineChain, createClient } from "viem";

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
});

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

const config = createConfig({
  chains: [ganache_test],
  // 不指定 connectors 的话，自动检测已经安装的钱包
  // connectors: connectors,
  ssr: true, // If your dApp uses server side rendering (SSR)
  transports: { [ganache_test.id]: http() },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

const queryClient = new QueryClient();

const app = (
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider coolMode>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);

function start() {
  const root = createRoot(document.getElementById("root")!);
  root.render(app);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
