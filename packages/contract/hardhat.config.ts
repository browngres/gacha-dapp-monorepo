import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers"
import { defineConfig } from "hardhat/config"
import dotenv from "dotenv"
dotenv.config()

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
      ganache:{
        version: "0.8.28",
        settings: {
          evmVersion: "london",
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      }
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
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
