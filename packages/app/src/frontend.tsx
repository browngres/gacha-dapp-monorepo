import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// Rainbowkit 相关
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, connectorsForWallets } from "@rainbow-me/rainbowkit";
import { config } from "./common/config";
// import { rainbowWallet, metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";

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
