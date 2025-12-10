# design

#### Markdown Notes 创建于 2025-12-10T04:56:09.626Z

## Blueprint

类似二次元抽卡游戏，或者理解成刮刮乐。
卡池（编号） `Pool`，每次抽就是一个 `Round`
种类以及百分概率："N,R,SR,SSR,UR"----"60,20,10,8,2"
抽卡后马上知道结果。
后端签名 + merkle tree 双重验证

### 流程

1. 系统创建奖池，编号，总量，概率，单次费用。 pool
2. 抽奖界面：用户调用抽奖方法，合约返回一个抽奖码，后端返回一个“地址+抽奖码”的签名
3. 系统后端将 “地址+兑奖序号” 写入 merkle tree
4. 兑奖界面：用户连接钱包，向后台请求 proof。
5. 用户调用合约的兑奖方法，提供 proof，签名。
6. 合约验证 proof 后，让奖励金库给用户发放奖励

### 随机数 feed

用一个单独的合约，使用一个脚本往链上写入值。
由于向合约写入的随机数任何人都能看到，所以只能用于测试环境。

生产环境应该使用 ChainLink VRF

### Scheme

抽奖结果：一个两位数。`00-99`
抽奖码：`keccak256(地址.pool编号.round编号.抽奖结果)`

### 后端

bun + sqlite 记录抽奖序号
记录 merkle tree

## 待定功能

- NFT

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