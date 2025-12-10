# gacha-dapp-monorepo

模拟抽卡的 solidity 简单实践项目，包含前后端以及合约

作为一个学习 [Patrick 智能合约全栈课程](https://www.youtube.com/watch?v=gyMwXuJrbJQ) 的大作业

### 项目特色

- bun (Runtime + Package Manager + Bundler)
- monorepo
- rainbowkit
- react + tailwind + daisyui
- hardhat 3

### 重点学习

- dapp 前后端
- 信标代理
- Merkle Tree 校验数据存在性
- 在合约调用其他合约
- Chainlink VRF
- 在开发测试中 Mock 合约
- 枚举

### 仓库架构

### Trivia

2025-12-10 最近 Anthropic 宣布收购 Bun，更加印证了当初接触 js 时采用 bun 的正确性。😁

### 参考资料

- [Bun Workspaces](https://bun.com/docs/pm/workspaces)
- [WTF Solidity 极简入门: 36. 默克尔树 Merkle Tree](https://github.com/AmazingAng/WTF-Solidity/blob/main/36_MerkleTree/readme.md)

#### VRF

- [RandomNumberConsumer test](https://github.com/smartcontractkit/hardhat-starter-kit/blob/main/test/unit/RandomNumberConsumer.spec.js)
- [Chainlink VRF 2.5 Local testing using a mock subscription contract](https://docs.chain.link/vrf/v2-5/subscription/test-locally)
- [hardhat-starter-kit](https://github.com/smartcontractkit/hardhat-starter-kit/tree/hardhat-3)