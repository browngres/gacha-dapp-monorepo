/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// Rainbowkit 相关
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";

// chains
import { defineChain } from "viem";

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
      http: [Bun.env.GANACHE_RPC_TEST!],
      // webSocket: [''],
    },
  },
  blockExplorers: {
    default: { name: "BlockScout Explorer", url: "http://127.0.0.1:9080" },
  },
  contracts: {},
});

const config = getDefaultConfig({
  appName: "Gacha App",
  projectId: "YOUR_PROJECT_ID",
  chains: [ganache_test],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
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
