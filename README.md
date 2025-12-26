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

### Trivia

2025-12-10 最近 Anthropic 宣布收购 Bun，更加印证了当初接触 js 时采用 bun 的正确性。😁

2025-12-11 喜欢 solady 的原因是，可以不用安装，没有 import 依赖，要啥直接复制单文件即可。

2025-12-14 关于稀有度计算之后存进结构体映射当中。花费了下午+晚上+上午来调试。reqId 都存了，结构体就是不给我存。怀疑是存储方法不对，但是又不报错，也不 revert。非常邪门。在 hardhat 内部模拟网、hardhat node、ganache 上各种想办法调试，利用了 `hardhat/console.sol`。单独拿出来试验就可以存，放进里面就是不存。最后接入 blockscout 浏览器，看到交易的 Event log 才终于意识到怎么回事。原来 VRF 的回调 fulfill 使用底层 call ，用 success 来标记是否成功，里面走到哪里算哪里。所以不会触发外部的交易失败。失败的原因就是给的 CALLBACK_GAS_LIMIT 太小了，直接复制的 VRF 文档中代码。怎么都没想到是这个 SB 玩意害得我 debug 很久。说明存储的方式并没有错，一开始写的就是对的。不过逼着我仔细攻读solidity 的数组、结构体的文档，中英文认真攻读，还看搜了网上的文章看。彻底理清楚了动态数组和结构体以及他们的存储规则。还是不亏的。😂

2025-12-16 NFT 图片参考使用 LoveLive SIF

2025-12-18 DaisyUI 实在是太贴心了，提供 36 种框架或构建工具下的安装方法。甚至给了提示词 rules，以及如何在各种 Vibe Coding 工具中去用。可以直接在提示词里塞 llms.txt 链接，或者在规则中填这个链接。除此之外，还提供了MCP服务器。更神奇的是，当我好奇它与 bootstrap 的区别时，它也有提供对比结果参考！

2025-12-18 2337 当前是一个很神奇的时间点， 今天晚上研究了很久。wagmi 上个月更新了 3.0.0，将所有 wallet connector 设置为了可选安装。这正是我所理想的方式，要杀自己安装啥，而不是一股脑全都安装（这让我想起来看其他人安装 matlab）。但是当前几乎没有人在意这些东西，大家用着 2.x 一切就好像本该如此一样。只有 discussion 有人问何时支持 wagmi 3。当然没有人理。2.x 的行为是虽然可能用不到但也全部安装。尽管一些小众到不能再小众的钱包也被支持，也要安装。甚至安装一些 solana 开头的库。总之平添了几百个依赖。
wagmi 文档中列出来的[钱包连接器](https://wagmi.sh/react/guides/connect-wallet)，专门扒出来他们的 npm 依赖，也都还没有跟进。所以现在的状况就是出了 V3，但是没人在意。 虽然有了 [Migrate from v2 to v3](https://wagmi.sh/react/guides/migrate-from-v2-to-v3)，但是不知道外界多久才能跟进上。 我当然可以退回 wagmi 2，但是这有悖于我的探索精神。正如学习 solidity 课程时坚持使用 hardhat 3，虽然资料相对2不多，而且许多地方变化较大。但是这种 **“给自己加难度”正是进步最快的方式，看英文、翻源码、迁移类比、开拓思路、面向未来** 。
所以目前的想法是，如果 rainbowkit 目前实在支持不了 3.0，那就按照 wagmi 文档的方法，[Build Your Own](https://wagmi.sh/react/guides/connect-wallet#build-your-own)，手搓一个连接按钮即可。其实用到的也只是一个连接按钮。

2025-12-19 今天做了新的实验。证明不是 rainbowkit 的问题。问题来自于 bun 的 dev server。它的运行过程会解析所有导入。如果用 bun 的 bundler 可以直接将可选依赖添加到 external。但是 dev server 没有这个功能。又想用 dev server，因为不用每次 build。不过 dev server 可以添加插件，像 bundler 一样。 使用 onResolve 就可以曲线救国。使用解析时检测到可选依赖就用空白替代。

2025-12-20 经过深思熟虑，抽卡然后 mint NFT 的流程，并不适合 merkle tree。因为这种不是事先构造好的树（白名单），或者后端非实时性的名单。频繁添加 leaf，马上使用其 proof，没有太大意义。于是决定从设计中移除 merkle。

2025-12-25 本来打算使用 `ReentrancyGuardTransient，` solidity 0.8.24 引入的新的存储空间 transient 瞬态存储 (2024 cancun 升级)。 transient storage 和 storage 并列的，仅本交易中存储有效，非常适合重入锁。操作 transient 费用固定 100 gas，是后者的1/200。但是最近的以太坊 2025 osaka 升级后， gas price 下降了100倍以上，从以前正常个位数降低到零点零几，最近能见到 0.02。 transient 不那么诱人了🤣。。另外 Ganache 并不支持后来的操作码。所以决定用原本的 `ReentrancyGuard` 。

2025-12-25 1511 多少有点笨了，签名端口忘记检查是否已经抽卡。意识到应该让前端用 tx 来证明。又意识到有了 tx 就可以读取事件，根本不用前端监听事件得到 reqId。 然后就发现自己费劲写了多么离谱的代码，gacha-step-one 竟然发起交易，并提前开始监听 event 得到参数。实际上，有了这个tx后可以直接得到 event。。。

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