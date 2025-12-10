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

稀有度枚举

稀有度概率：
映射 稀有度 到 uint8

抽卡记录： 地址到 reqId 数组
mapping(address => uint256[]) private s_results;

结果记录
抽取结果： reqId 到 请求结果结构体
mapping(uint256 => address) private rollers;

抽卡人记录 reqId 到 地址
mapping(uint256 => address) private rollers;

请求结果结构体：reqId，fulfilled，随机数个数，随机数数组，抽奖结果数组（枚举）

抽卡结果：一个两位数。`00-99`

抽卡码`keccak256(地址.pool编号.round编号.reqId)`

### 安全考虑

抽卡失败/随机数获取失败

### 后端

bun + sqlite 记录抽奖序号
记录 merkle tree

## 待定功能

- NFT
- 卡池管理合约，用于创建卡池（创建信标代理）。使用合约工厂部署合约。查看状态，批量暂停。
- 保底

## TODO

### 前端

- [ ] 基本的前端界面
- [ ] 前端抽卡特效

### 合约

- openzeppelin
  - [ ] ownable、pauseable
  - [ ] 信标代理
  - [ ] ReentranceGuard

- [ ] transient 重入锁
- [ ] 给合约代码添加 NatSpec 注释

### dev todo

- [x] 安装 rainbowkit
- [x] prettier
- [ ] 将流程转换为流程图
- [ ] Gas report
- [ ] `package.json` scripts
- [ ] 编写测试
- [ ] env.example
