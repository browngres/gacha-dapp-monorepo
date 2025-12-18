import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers"
import { defineConfig } from "hardhat/config"
import dotenv from "dotenv"

// 指定绝对路径，防止不同位置找不到 .env，比如 solidity 插件工作目录不同
import { fileURLToPath } from 'url';
import { dirname,resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, ".env") })

// 实际上可以不用 dotenv，Bun 已经内置了。但是 hardhat 的 vscode 插件使用不了 bun，报错会阻断插件功能，所以这个文件还得用。
const { GANACHE_RPC_MAIN, GANACHE_RPC_TEST } = process.env

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      ganache: {
        version: "0.8.28",
        settings: {
          evmVersion: "london",
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
    npmFilesToBuild: [
      "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol",
      "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol",
    ],
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhat_node: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
    },
    ganache_main: {
      type: "http",
      chainType: "l1",
      url: GANACHE_RPC_MAIN!,
    },
    ganache_test: {
      type: "http",
      chainType: "l1",
      url: GANACHE_RPC_TEST!,
    },
  },
})
