# dev

#### Markdown Notes 创建于 2026-05-01T02:06:44.106Z

## scripts

### contract

- `clean`: hardhat clean
- `compile`: hardhat compile
- `test:gacha`: 仅测试名字中带有 'Gacha' 的。附带 coverage、gas-stats
- `test:nft`: 仅测试 `GachaCard.ts`。附带 coverage、gas-stats
- `test:consumer`: 仅测试 `RandomNumberConsumer.ts`。附带 coverage、gas-stats
- `ignition:vrf`: `bunx hardhat ignition deploy ./ignition/modules/VRF.ts --network 'ganache_test' --deployment-id 'VRF-on-ganache_test' --build-profile 'ganache'`
- `ignition:gacha`: `bunx hardhat ignition deploy ./ignition/modules/GachaPool.ts --network 'ganache_test' --deployment-id 'GachaPool-on-ganache_test' --build-profile 'ganache'`
- `feed-vrf`: 运行 `feedVRF.ts`

### app

## 待定功能

- 卡池管理合约，用于创建卡池（创建信标代理）。
  - 使用合约工厂部署合约。查看状态，批量暂停。
- 特权用户（roles 实现）
  - 免费抽
  - 打折抽
  - 必出稀有
- UR 记录

## TODO

### 前端

- [x] 基本的前端界面
- [x] “我的” NFT 显示面板
- [x] NFT hover-3d, indicator(Rarity)

### 合约

- openzeppelin
  - [x] role, pauseable
  - [x] 信标代理
  - [x] ReentranceGuard
- [x] 编写测试
  - [x] 检查 coverage
- [x] 给合约代码添加 NatSpec 注释
- [x] 按照风格指南整理合约代码
- [x] 检查修饰符(role, pause, reentrance)
- Gas 优化
  - [x] Gas report
  - [x] 存储槽优化
- [x] 随机数生命周期
- [x] ERC-7201 Namespaced 存储槽

### dev todo

- [x] 安装 rainbowkit
- [x] prettier
- [x] 将流程转换为流程图
- [x] `package.json` scripts

## 参考合约

hardhat 3 / ignition 文档中零碎的合约写法。基本上是用到什么查什么，之前的学习过程中已经不断地、翻来覆去地看 hardhat 3 文档。

信标代理参考 openzeppelin 文章, 结合 hardhat 3 ignition 的 Upgradeable Contracts 部署方法。

[智能合约 - NFT盲盒](https://blog.csdn.net/wcc19840827/article/details/146998758)

VRF 可升级改造
[Chainlink 可升级改造](https://github.com/smartcontractkit/chainlink/issues/4976)
[How to implement Chainlink VRFv2 with Upgradeable Transparent Proxy smart contract?](https://ethereum.stackexchange.com/questions/161819/how-to-implement-chainlink-vrfv2-with-upgradeable-transparent-proxy-smart-contra)

ERC721
[`Function _setTokenURI() in ERC721 is gone in OpenZeppelin ^0.8.0 contracts`](https://ethereum.stackexchange.com/questions/93917/function-settokenuri-in-erc721-is-gone-in-openzeppelin-0-8-0-contracts)

NFT 合约参考 0GLunarian NFT 合约

项目参考
[ERC20-Airdop-with-Merkle-Trees-Wagmi-V2-RainbowKit-V2](https://github.com/BenBktech/ERC20-Airdop-with-Merkle-Trees-Wagmi-V2-RainbowKit-V2)
