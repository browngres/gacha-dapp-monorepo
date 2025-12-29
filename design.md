# design

#### Markdown Notes 创建于 2025-12-10T04:56:09.626Z

## Blueprint

类似二次元抽卡游戏，或者理解成刮刮乐。
卡池（编号） `Pool`，每次抽就是一个 `Request`
种类以及百分概率："N,R,SR,SSR,UR"----"60,20,10,8,2"
抽卡后马上知道结果。
十连费用打折
十连有保底
后端签名

### 合约架构

合约1：卡池代理
合约2：卡池实现，继承了 consumer。主要的逻辑
合约3：卡池信标
合约4：随机数 VRF Coordinator Mock
合约5， Gacha card NFT

`RandomConsumer.sol` 用于测试 VRF 的一个最小 consumer

### 流程

1. 创建卡池，编号，总量，概率，单次费用。 pool
2. 抽卡界面：用户调用抽卡方法，发起交易，合约发出随机数请求。
3. 前端从交易结果中得到 requestId，向后端提供成功抽卡的 tx + poolId，请求签名。
4. 后端根据 tx 读取并检查信息，签名(requestId + 用户地址 + 合约地址)，并返回前端。
5. 用脚本（独立于前端、后端，放在合约脚本里面）监控链上 VRF Mock 事件，向 VRF Mock 写入随机数。VRF Mock 给到卡池
6. 兑奖界面：用户连接钱包，向合约发出请求，提供签名、requestId。
7. 合约验证签名后，mint nft

发起抽卡交易后，前端显示四个步骤：

1. 等待交易结果（读取 event gachaOne）
2. 等待签名（读取抽卡 API 的返回数据）
3. 等待随机数满足（读取 event RandomFulfilled）
4. 读取结果（调用 getResult）

### 随机数 feed

使用 Chainlink VRF V2.5 的 mock 版本。使用一个脚本定时向链上 feed 随机数。
由于向合约写入的随机数任何人都能看到，所以只能用于测试环境。

> 备注： 由于不想安装 `@chainlink/contracts` 代理一大堆依赖以及版本冲突。使用 remix 将 mock 合约展平。
> `@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol`
> 为减小文件大小，去除了跟 mock 无关的所有注释

生产环境应该使用 ChainLink VRF

### Scheme

**枚举**

- 稀有度: 5个。如果不想要某个，将其概率设置为 0

**结构体**

- 随机数请求: 随机数个数，随机数数组，稀有度结果

**基本类型**

- subId: consumer 的 VRF 订阅 id
- keyHash: VRF 费用相关，mock 中不用管
- CALLBACK_GAS_LIMIT: 返回随机数 tx 的gas 限制
- REQUEST_CONFIRMATIONS: VRF 要求确认次数，mock 中不用管
- IVRFCoordinatorV2Plus: VRF 地址
- poolId: 卡池 id
- supply: 总量，表现为最大抽卡次数
- costGwei: 单次抽卡费用，单位 Gwei
- claimSigner: claim 签名者，应该使用单独的一个地址

**映射**

- percentages: 稀有度概率。稀有度 到 uint8
- reqToAddress: 抽卡人记录。reqId 到 地址
- addressToReq: 抽卡记录。 地址 到 reqId 数组
- requests: 随机数请求记录。 reqId 到 随机数请求结构体

**枚举集合**

- processingRequests: 进行中的抽卡（等待随机数中）
- fulfilledRequests: 已获得随机数的抽卡
- claimedRequests: 已经领取的抽卡
- allPlayers: 所有玩家

**其他**

- create2 salt `keccak256("Gacha.GachaPool.<PoolId>")`
- 签名：后端对“地址 + requestId + poolId”消息签名

### NFT Scheme

基于 ERC721（使用 Solady 的实现代码）
除了 metadata，额外使用 Token ExtraData 记录 Rarity

**metadata**:

```json
{
  "name": "Rin",
  "description": "A Gacha card.",
  "image": "https://xx/xx/123.png",
  "external_url": "https://xxxx/123",
  "attributes": [
    {
      "trait_type": "Waifu",
      "value": "Rin"
    },
    {
      "trait_type": "Color",
      "value": "Green"
    },
    {
      "trait_type": "Rarity",
      "value": "UR"
    }
  ]
}
```

**Contract-level metadata**:

```json
{
  "name": "Gacha card NFT",
  "description": "Gacha card NFT collections created by Rainy with ❤️. Pictures by LoveLive SIF Game.",
  "image": "https://external-link-url.com/image.png",
  "external_link": "https://external-link-url.com"
}
```

### 安全考虑

reqId 的状态不设置公开的方法可以查到（ `processingRequests`, `fulfilledRequests`, `claimedRequests`）不设置 getter 函数。
使用后端存储是否 claimed。

抽卡失败/随机数获取失败

**VRF 安全注意事项**：
[VRF Security Considerations](https://docs.chain.link/vrf/v2-5/security)

- 根据 `requestID` 按顺序 feed 随机数，以免出现意外。
- 随机数请求不能重发或者取消
- 合约在提交随机性请求后不应接受任何其他用户提供的输入
- `fulfillRandomWords` 不得 revert
- 不要重写 `rawFulfillRandomness`

后端私钥安全

- admin 应该使用多签钱包

防止重入攻击

- 使用重入锁
- 检查-影响-交互模式

> 检查-影响-交互模式：先检查状态和参数，再更新状态，最后再交互做事
> 例如提现场景。先检查余额，再更新余额，最后才发送 token

### 随机数生命周期

一个能向 VRF 请求随机数的合约，称之为 consumer ，应该继承 `VRFConsumerBaseV2Plus`。
有这两个方法： `fulfillRandomWords`, `rawFulfillRandomWords`。
前者需要自己实现，就是自定义的业务逻辑。后者是接收 VRF 回调获得随机数的的方法，已经实现不应该修改。
当收到 VRF 回调时。 VRF 调用`rawFulfillRandomWords`，然后 `rawFulfillRandomWords` 调用 `fulfillRandomWords`。

1. 用户向合约请求抽卡 `GachaOne` ---> `_requestRandomWords` ---> Pool 作为 consumer 调用 VRF 合约的 `requestRandomWords` 方法。卡池获得返回的 RequestId 并记录。
2. VRF 的 `RandomWordsRequested` 事件被发出。 VRF 得到 requestId , consumer 等信息。
3. 外部（预言机）给出随机数，并回调 consumer （就是卡池） 的 `rawFulfillRandomWords` 方法。
4. `rawFulfillRandomWords` 会调用卡池的 `fulfillRandomWords`。 真正地将随机数记录下来，处理业务逻辑。
5. mock feedVRF 的实现是监听事件并调用 mock 版本 VRF 的 `fulfillRandomWordsWithOverride` 方法。然后像真正的 VRF 一样调用 consumer 的 `rawFulfillRandomWords`。 只不过随机数来自于脚本的投喂。
6. 卡池得到随机数后，计算 rarity，更新请求的状态、存储结果。

**特别注意：**
`fulfillRandomWords` 不得 revert。回调会使用底层 call 来调用 `fulfillRandomWords`，就算 call 失败也会继续下去，VRF 将这次请求记录为失败。

```solidity
bytes memory callReq = abi.encodeWithSelector(v.rawFulfillRandomWords.selector, _requestId, _words);
(bool success, ) = _consumer.call{gas: req.callbackGasLimit}(callReq);
```

也就是说 VRF 不管你的业务逻辑，只管尝试向 consumer 给出随机数。记录 call 是否成功。没有重试机制。

### 后端

bun + sqlite 记录抽卡序号
NFT Token URI
NFT contractURI

## 待定功能

- 卡池管理合约，用于创建卡池（创建信标代理）。
  - 使用合约工厂部署合约。查看状态，批量暂停。
  - 部署 NFT 合约
  - （多个卡池公用同一个 NFT 合约）
- 特权用户（roles 实现）
  - 免费抽
  - 打折抽
  - 必出稀有

## TODO

### 前端

- [x] 基本的前端界面
- [ ] “我的” NFT 显示面板
- [ ] NFT hover-3d, indicator(Rarity)
- [ ] winston logger

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
- [ ] 将流程转换为流程图
- [ ] `package.json` scripts
- [ ] env.example

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
