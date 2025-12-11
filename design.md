# design

#### Markdown Notes 创建于 2025-12-10T04:56:09.626Z

## Blueprint

类似二次元抽卡游戏，或者理解成刮刮乐。
卡池（编号） `Pool`，每次抽就是一个 `Round`
种类以及百分概率："N,R,SR,SSR,UR"----"60,20,10,8,2"
抽卡后马上知道结果。
十连
后端签名 + merkle tree 双重验证

### 合约架构

合约1：卡池代理
合约2：卡池实现，继承了 consumer。主要的逻辑
合约3：卡池信标
合约4：随机数 VRF Coordinator Mock

`RandomConsumer.sol` 用于测试 VRF 的一个最小 consumer

### 流程

1. 创建卡池，编号，总量，概率，单次费用。 pool
2. 抽奖界面：用户调用抽奖方法，合约返回一个抽奖码，后端返回一个“地址+抽奖码”的签名
3. 系统后端将 “地址+兑奖序号” 写入 merkle tree
4. 兑奖界面：用户连接钱包，向后台请求 proof。
5. 用户调用合约的兑奖方法，提供 proof，签名。
6. 合约验证 proof 后，让奖励金库给用户发放奖励

### 随机数 feed

使用 Chainlink VRF V2.5 的 mock 版本。使用一个脚本定时向链上 feed 随机数。
由于向合约写入的随机数任何人都能看到，所以只能用于测试环境。

> 备注： 由于不想安装 `@chainlink/contracts` 代理一大堆依赖以及版本冲突。使用 remix 将 mock 合约展平。
> `@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol`
> 为减小文件大小，去除了跟 mock 无关的所有注释

生产环境应该使用 ChainLink VRF

### Scheme

**枚举**

- 稀有度

**映射**

- 稀有度概率： 稀有度 到 uint8
- 抽卡人记录(rollers)： reqId 到 地址
- 抽卡记录： 地址 到 reqId 数组
- 随机数请求记录： reqId 到 随机数请求结构体

**枚举集合**

- 进行中的抽奖（等待随机数中）
- 已完成的抽奖
- 所有玩家
- 特权地址

**结构体**

- 随机数请求 ：随机数个数，随机数数组，稀有度结果

**其他**

- 抽卡码`keccak256(地址.pool编号.round编号.reqId)`，发出请求后返回

### 安全考虑

抽卡失败/随机数获取失败

### 后端

bun + sqlite 记录抽奖序号
记录 merkle tree

## 待定功能

- NFT
- 卡池管理合约，用于创建卡池（创建信标代理）。使用合约工厂部署合约。查看状态，批量暂停。
  - salt 就用 `keccak256("Gacha.GachaPool.<PoolId>")`
- 特权用户（roles 实现）
  - 免费抽
  - 打折抽
  - 必出稀有
- 保底机制

## TODO

### 前端

- [ ] 基本的前端界面
- [ ] 前端抽卡特效

### 合约

- openzeppelin
  - [x] role, pauseable
  - [x] 信标代理
  - [ ] ReentranceGuard
- [ ] 编写测试
- [ ] 给合约代码添加 NatSpec 注释
- [ ] 按照风格指南整理合约代码
- [ ] 检查修饰符(role, pause, reentrance)
- Gas 优化
  - [ ] Gas report
  - [ ] 存储槽优化

### dev todo

- [x] 安装 rainbowkit
- [x] prettier
- [ ] 将流程转换为流程图
- [ ] `package.json` scripts
- [ ] env.example

## 参考合约

hardhat 3 / ignition 文档中零碎的合约写法。基本上是用到什么查什么，之前的学习过程中已经不断地、翻来覆去地看 hardhat 3 文档。

信标代理参考 openzeppelin 文章, 结合 hardhat 3 ignition 的 Upgradeable Contracts 部署方法。

合约部署合约 参考了 0G 验证者管理合约。

存储槽设置 参考了 0G AgentNFT 合约存储布局

[智能合约 - NFT盲盒](https://blog.csdn.net/wcc19840827/article/details/146998758)
