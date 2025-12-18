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
- ERC721 NFT
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
2025-12-14 关于稀有度计算之后存进结构体映射当中。花费了下午+晚上+上午来调试。reqId 都存了，结构体就是不给我存。怀疑是存储方法不对，但是又不报错，也不 revert。非常邪门。在 hardhat 内部模拟网、hardhat node、ganache 上各种想办法调试，利用了 `hardhat/console.sol`。单独拿出来试验就可以存，放进里面就是不存。最后接入 blockscout 浏览器，看到交易的 Event log 才终于意识到怎么回事。原来 VRF 的回调 fulfill 使用底层 call ，用 success 来标记是否成功，里面走到哪里算哪里。所以不会触发外部的交易失败。失败的原因就是给的 CALLBACK_GAS_LIMIT 太小了，直接复制的 VRF 文档中代码。怎么都没想到是这个 SB 玩意害得我 debug 很久。说明存储的方式并没有错，一开始写的就是对的。不过逼着我仔细攻读solidity 的数组、结构体的文档，中英文认真攻读，还看搜了网上的文章看。彻底理清楚了动态数组和结构体以及他们的存储规则。还是不亏的。😂
2025-12-16 NFT 图片参考使用 LoveLive SIF
2025-12-18 DaisyUI 实在是太贴心了，提供 36 种框架或构建工具下的安装方法。甚至给了提示词 rules，以及如何在各种 Vibe Coding 工具中去用。可以直接在提示词里塞 llms.txt 链接，或者在规则中填这个链接。除此之外，还提供了MCP服务器。更神奇的是，当我好奇它与 bootstrap 的区别时，它也有提供对比结果参考！

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

- [如何创建和使用ERC-721代币？](https://learnblockchain.cn/article/2077)
- [Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
