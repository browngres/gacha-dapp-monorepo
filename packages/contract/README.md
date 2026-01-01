
## 部署方法

`package.json` 里面的快捷命令 `ignition:gacha`
即：

```bash
bunx hardhat ignition deploy ./ignition/modules/GachaPool.ts --network 'ganache_test' --deployment-id 'GachaPool-on-ganache_test' --build-profile 'ganache'
```

会部署或使用现有 VRF 模块，（根据 network 和 deployment-id 自动查找）。也可先部署 VRF Mock。 `ignition:vrf`


ignition 后，在这里找到部署地址： `packages\contract\ignition\deployments\<deployment-id>\deployed_addresses.json`

```json
{
  "GachaPoolModule#GachaPoolImplement": "0x9c626d8a8E69863f20E8269D53a7AdC986430d8F",
  "VRFModule#VRFCoordinatorV2_5Mock": "0x589B0D7C9A2Fb128B49d056b603Da5b982387312",
  "GachaPoolModule#UpgradeableBeacon": "0xC4b0c9694079dCDeEfAAb191F593DCED1e5158d3",
  "GachaPoolModule#BeaconProxy": "0xD6fB9d5EA5A958180f5881e6083ac2738aCa5DEd",
  "GachaPoolModule#GachaPool": "0xD6fB9d5EA5A958180f5881e6083ac2738aCa5DEd"
}
```

分别是：

- GachaPool 实现
- VRF Mock
- GachaPool 信标
- GachaPool 代理(BeaconProxy ABI)
- GachaPool 代理(GachaPool ABI)

后两个区别在于代码中产生的实例的 ABI 不同。代码外没有区别。

### 单独测试 VRF

如果想单独测试 VRF，可以用这个模块 `VrfWithConsumer.ts`。部署 VRF Mock + 最小 Consumer。

## 关于 GachaCardNFT 合约

ignition 模块已经添加了调用 GachaPool 的 createNFT 方法。无需单独部署。

GachaCardNFT 不应该手动部署。而是通过 GachaPool 部署。

NFT 的三个非 view 函数（包括 mint）只能用 GachaPool 调用。（Owner 是 GachaPool 合约）

部署合约的费用由发起交易者支付，而不是 GachaPool 支付。部署 NFT 合约的交易大约 1.2M Gas。

**为什么不外部部署？**
假设 NFT 具有一定价值，NFT 不应该能被随意 mint，包括卡池的 Owner。所以 NFT 的 admin 只能是卡池。

同时也为了确保 NFT 数量与卡池里面的抽卡结果对应。

## Gas (手动测试)

### 十连

- gachaTen | 308K
- Claim (mint 10个 NFT) | 427K

### 卡池

- 创建实现合约 | 4.11 M
- 创建信标合约 | 252K
- 创建代理合约(包括初始化操作) | 490K
- setNftUri | 134K
- deployGachaCardNFT | 1.10 M

### VRF

- 创建合约 | 3.05 M
- createSubscription | 144K
- addConsumer | 95K
- fulfill 10个随机数 | 458K
