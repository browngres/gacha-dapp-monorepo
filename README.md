# gacha-dapp-monorepo

模拟抽卡的 solidity 简单实践项目，包含前后端以及合约

作为一个学习 [Patrick 智能合约全栈课程](https://www.youtube.com/watch?v=gyMwXuJrbJQ) 的大作业

### 项目特色

- bun (Runtime + Package Manager + Bundler)
- monorepo
- rainbowkit
- wagmi 3
- react + tailwind + daisyui
- hardhat 3
- Chainlink VRF
- ERC721 NFT
- 由合约创建合约，(solady create3)
- 部分代码使用 solady 替代 OZ

### 重点学习（技术难点）

- dapp 前后端
- hardhat 3 ignition
- 信标代理
- 在合约调用其他合约
- Chainlink VRF
- 在开发测试中 Mock 合约
- 不可升级合约的 initializer 改造
- 可枚举的集合(EnumerableSet)
- access control roles
- transient storage (ReentrancyGuardTransient) （仅兼容 Cancun 升级之后的 EVM）
- ERC-7201 Namespaced 存储槽

### 仓库架构

合约 [README.md](./packages/contract/README.md)

### 参考资料

#### 文档

- [hardhat 3 文档](https://hardhat.org/docs/getting-started)
- [Hardhat Ignition 文档](https://hardhat.org/ignition/docs/getting-started)
- [Hardhat Ignition - Upgradeable Contracts](https://hardhat.org/ignition/docs/guides/upgradeable-proxies)
- [Bun Runtime](https://bun.com/docs)
- [Bun Workspaces](https://bun.com/docs/pm/workspaces)
- [Bun Bundler](https://bun.com/docs/bundler)
- [React](https://zh-hans.react.dev/learn)
- [Viem](https://viem.sh/docs/getting-started)
- [wagmi](https://wagmi.sh/react/getting-started)
- [daisyUI](https://daisyui.com/components/)
- [tailwind](https://tailwindcss.com/docs/)
- [TanStack Query](https://tanstack.com/query/)
- [solady](https://vectorized.github.io/solady/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/5.x)

#### 文章

- [Getting Started with Chainlink VRF V2.5](https://docs.chain.link/vrf/v2-5/getting-started)
- [Chainlink VRF 2.5 Local testing using a mock subscription contract](https://docs.chain.link/vrf/v2-5/subscription/test-locally)
- [RandomNumberConsumer test](https://github.com/smartcontractkit/hardhat-starter-kit/blob/main/test/unit/RandomNumberConsumer.spec.js)
- [chainlink hardhat-starter-kit](https://github.com/smartcontractkit/hardhat-starter-kit/tree/hardhat-3)

- [BeaconProxy](https://docs.openzeppelin.com/contracts/5.x/api/proxy#beaconproxy)
- [Using with Hardhat | OpenZeppelin Docs](https://docs.openzeppelin.com/upgrades-plugins/hardhat-upgrades)
- [Writing Upgradeable Contracts](https://docs.openzeppelin.com/upgrades-plugins/writing-upgradeable)
- [What does `_disableInitializers();` function mean?](https://forum.openzeppelin.com/t/what-does-disableinitializers-function-mean/28730)

- [如何创建和使用ERC-721代币？](https://learnblockchain.cn/article/2077)
- [Metadata Standards](https://docs.opensea.io/docs/metadata-standards)

- [WTF Solidity极简入门: 6. 引用类型, array, struct](https://github.com/AmazingAng/WTF-Solidity/blob/main/06_ArrayAndStruct/readme.md)
- [WTF Solidity极简入门: 25. CREATE2](https://github.com/AmazingAng/WTF-Solidity/blob/main/25_Create2/readme.md)

- [When to use Storage vs. Memory vs. Calldata in Solidity](https://www.alchemy.com/docs/when-to-use-storage-vs-memory-vs-calldata-in-solidity)

- [WTF Solidity 合约安全: S01. 重入攻击](https://github.com/AmazingAng/WTF-Solidity/blob/main/S01_ReentrancyAttack/readme.md)
- [Transient Storage Opcodes in Solidity 0.8.24](https://www.soliditylang.org/blog/2024/01/26/transient-storage/)

- [ Wisps: The Magical World of Create2](https://blog.ricmoo.com/wisps-the-magical-world-of-create2-5c2177027604)
- [What are the differences between create2 and create3?](https://ethereum.stackexchange.com/questions/145240/what-are-the-differences-between-create2-and-create3)