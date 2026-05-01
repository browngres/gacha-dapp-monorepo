# 流程

## 随机数请求与回调数据流

```mermaid
sequenceDiagram
    participant User as 用户(前端)
    participant Pool as Pool 合约
    participant MockVRF as MockVRF 合约
    participant Feed as VRF feed 脚本

    User->>Pool: GachaOne() 发起抽卡
    Note over Pool: 内部调用 _requestRandomWords
    Pool->>MockVRF: requestRandomWords()
    MockVRF-->>Pool: 返回 requestId
    Note over Pool: 记录 requestId 与用户状态

    MockVRF-->>Feed: 发出 RandomWordsRequested 事件(requestId, consumer=Pool地址)
    Feed->>MockVRF: fulfillRandomWordsWithOverride(requestId, 随机数)
    Note over MockVRF: 收到外部随机数
    MockVRF->>Pool: rawFulfillRandomWords(requestId, 随机数)
    Note over Pool: rawFulfillRandomWords 内部调用 fulfillRandomWords
    Pool->>Pool: fulfillRandomWords: 存储随机数、计算稀有度、更新请求状态
```

**数据流动关系**：

- `requestId` 从 MockVRF 流回 Pool，并被事件携带到 feed 脚本。
- 随机数由 feed 脚本注入 MockVRF，再通过 `rawFulfillRandomWords` 流入 Pool。
- Pool 内部最终将随机数转化为抽卡结果。

---

### 整体抽卡‑签名‑兑奖

```mermaid
sequenceDiagram
    participant U as 用户(前端)
    participant B as 后端服务
    participant P as Pool 合约
    participant V as VRF 合约 (MockVRF)
    participant F as VRF Feed 脚本
    participant N as NFT 合约

    Note over P,N: 部署阶段
    P->>N: 1.1 创建 / 关联 NFT 合约

    rect rgb(240, 248, 255)
        Note over U,F: 抽卡请求阶段
        U->>P: 2.1 调用 GachaOne()（发送交易）
        P->>V: 2.2 requestRandomWords()
        V-->>P: 2.3 返回 requestId
        Note over P: 2.4 记录 requestId，等待随机数
        U->>U: 2.5 从交易收据解析出 requestId
        U->>B: 2.6 发送 (txHash, poolId) 请求签名
        B->>B: 2.7 读取链上交易，验证合法性
        B-->>U: 2.8 返回签名 sig(requestId, 用户地址, Pool地址)
    end

    rect rgb(255, 245, 238)
        Note over F,V: 随机数 fulfill（可并行发生）
        V-->>F: 3.1 RandomWordsRequested 事件
        F->>V: 3.2 fulfillRandomWordsWithOverride(requestId, 随机数)
        V->>P: 3.3 rawFulfillRandomWords(requestId, 随机数)
        P->>P: 3.4 存储随机数，计算稀有度，标记可兑奖
    end

    rect rgb(240, 255, 240)
        Note over U,N: 兑奖阶段
        U->>P: 4.1 调用 claim(requestId, 签名)
        P->>P: 4.2 检查 requestId（已就绪且未铸造），验证签名（recover），用户地址
        P->>N: 4.3 mintWithRarity(用户地址, 稀有度)
        N-->>U: 4.4 铸造 NFT 至用户钱包
    end
```

**关键数据流动**：

- **交易哈希与requestId**：从链上交易流入前端，再给后端。
- **签名**：前端发出请求，由后端生成，返回前端，最终送入合约进行验证。
- **随机数**：通过 feed → MockVRF → `rawFulfillRandomWords` 进入 Pool，与请求绑定。
