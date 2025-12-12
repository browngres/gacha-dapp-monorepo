# gacha-dapp-monorepo

模拟抽卡的 solidity 简单实践项目，包含前后端以及合约

作为一个学习 [Patrick 智能合约全栈课程](https://www.youtube.com/watch?v=gyMwXuJrbJQ) 的大作业

### 项目特色

- bun (Runtime + Package Manager + Bundler)
- monorepo
- rainbowkit
- react + tailwind + daisyui
- hardhat 3
- Chainlink VRF
- 部分代码使用 solady 替代 OZ

### 重点学习（技术难点）

- dapp 前后端
- hardhat 3 ignition
- 信标代理
- Merkle Tree 校验数据存在性
- 在合约调用其他合约
- Chainlink VRF
- 在开发测试中 Mock 合约
- 不可升级合约的 initializer 改造
- 可枚举的集合(EnumerableSet)
- create2 ，由合约创建合约
- access control roles
- transient storage (ReentrancyGuardTransient) （仅兼容 Cancun 升级之后的 EVM）
- ERC-7201 Namespaced 存储槽

### 仓库架构

### Trivia

2025-12-10 最近 Anthropic 宣布收购 Bun，更加印证了当初接触 js 时采用 bun 的正确性。😁
2025-12-11 喜欢 solady 的原因是，可以不用安装，没有 import 依赖，要啥直接复制单文件即可。

### 参考资料

#### 文档

- [hardhat 3 文档](https://hardhat.org/docs/getting-started)
- [Hardhat Ignition 文档](https://hardhat.org/ignition/docs/getting-started)
- [Hardhat Ignition - Upgradeable Contracts](https://hardhat.org/ignition/docs/guides/upgradeable-proxies)
- [Bun Runtime](https://bun.com/docs)
- [Bun Workspaces](https://bun.com/docs/pm/workspaces)
- [Bun Bundler](https://bun.com/docs/bundler)

#### 文章

- [Getting Started with Chainlink VRF V2.5](https://docs.chain.link/vrf/v2-5/getting-started)
- [Chainlink VRF 2.5 Local testing using a mock subscription contract](https://docs.chain.link/vrf/v2-5/subscription/test-locally)
- [RandomNumberConsumer test](https://github.com/smartcontractkit/hardhat-starter-kit/blob/main/test/unit/RandomNumberConsumer.spec.js)
- [chainlink hardhat-starter-kit](https://github.com/smartcontractkit/hardhat-starter-kit/tree/hardhat-3)

- [BeaconProxy](https://docs.openzeppelin.com/contracts/5.x/api/proxy#beaconproxy)
- [Using with Hardhat | OpenZeppelin Docs](https://docs.openzeppelin.com/upgrades-plugins/hardhat-upgrades)
- [WTF Solidity 极简入门: 36. 默克尔树 Merkle Tree](https://github.com/AmazingAng/WTF-Solidity/blob/main/36_MerkleTree/readme.md)
- [Writing Upgradeable Contracts](https://docs.openzeppelin.com/upgrades-plugins/writing-upgradeable)
- [What does `_disableInitializers();` function mean?](https://forum.openzeppelin.com/t/what-does-disableinitializers-function-mean/28730)
