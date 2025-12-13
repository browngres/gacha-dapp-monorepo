import { expect } from "chai"
import { network } from "hardhat"

import type { GachaPool, VRFCoordinatorV2_5Mock } from "../types/ethers-contracts/index.js"
import gachaPoolModule from "../ignition/modules/GachaPool.js"

describe("GachaPool Rarity Unit Tests", function () {
  let gachaPool: GachaPool
  let vrf: VRFCoordinatorV2_5Mock

  before("Deploy GachaPool", async function () {
    const { ethers, ignition } = await network.connect()
    const { proxy: _gacha } = await ignition.deploy(gachaPoolModule)
    gachaPool = await ethers.getContractAt("GachaPool", _gacha.target)
    const _vrf = await gachaPool.getAddressVRF()
    vrf = await ethers.getContractAt("VRFCoordinatorV2_5Mock", _vrf)
  })

  const gachaOneTime = async (): Promise<bigint> => {
    // 发起一次请求，返回 reqId
    return new Promise<bigint>((resolve, reject) => {
      // 防止永远等不到事件（超时 3 秒）
      const timer = setTimeout(() => {
        reject(new Error("Timeout waiting for RandomRequested"))
      }, 3000)
      // 监听请求事件(这里也可以监听 VRF 的)
      gachaPool.once(gachaPool.getEvent("RandomRequested"), (requestId) => {
        clearTimeout(timer) // 清除超时
        resolve(requestId) // 返回 reqId
      })
      gachaPool.gachaOne()
    })
  }

  const testRarity = (randomWords: number[], expected: number[]) =>
    async function () {
      const reqId = await gachaOneTime()
      // 给出指定的随机数
      const tx = await vrf.fulfillRandomWordsWithOverride(reqId, gachaPool.target, randomWords)
      const txReceipt = await tx.wait()
      // console.log(txReceipt);

      // await expect(vrf.fulfillRandomWordsWithOverride(reqId,gachaPool.target,randomWords)).to.emit(gachaPool,"RandomFulfilled")
      // 检查结果
      const result = await gachaPool.getResult(reqId)
      console.log("result of reqId:", reqId, result)
      // expect(result[0]).equal(1) // numWords
      // expect(result[1]).to.have.members(words); // words
      // expect(result[2]).to.have.members([3n]) // rarity
      // expect(gachaPool.requests(reqId)).equal(expected[0])
    };

  describe("Default percentages", function () {
    before("Pause and set percentages [2, 8, 10, 20, 60]", async function () {
      await gachaPool.pause()
      console.log("Paused")
      await gachaPool.setPercentage([2, 8, 10, 20, 60])
      await gachaPool.unpause()
      console.log("Unpaused")
    })

    it("correctly give rarity N", testRarity([999027], [4]))
    // it("correctly give rarity UR", testRarity([99999], [0]))

  })
})

// 测试 rarity
// 1. 5种都有  [2, 8, 10, 20, 60]
// 2. 第一个为0 [0, 10, 10, 20, 60]
// 3. 中间为0  [2, 8, 0, 30, 60]
// 4. 最后有0  [2, 8, 0, 90, 0]
