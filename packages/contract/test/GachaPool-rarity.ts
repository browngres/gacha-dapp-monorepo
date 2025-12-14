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

  const testRarity = (randomWords: bigint[], expected: bigint[]) =>
    async function () {
      const reqId = await gachaOneTime()
      // 给出指定的随机数
      await expect(vrf.fulfillRandomWordsWithOverride(reqId, gachaPool.target, randomWords)).to.emit(
        gachaPool,
        "RandomFulfilled",
      )
      // 检查结果
      const result = await gachaPool.getResult(reqId)
      // console.log("result of reqId:", reqId, result)
      expect(result[0]).equal(1) // numWords
      expect(result[1]).to.have.members(randomWords) // words
      expect(result[2]).to.have.members(expected) // rarity
    }

  describe("Default percentages", function () {
    before("Pause and set percentages [2, 8, 10, 20, 60]", async function () {
      await gachaPool.pause()
      // console.log("Paused")
      await gachaPool.setPercentage([2, 8, 10, 20, 60])
      await gachaPool.unpause()
      // console.log("Unpaused")
    })

    it("correctly gives rarity N", testRarity([999000n], [4n])) // [0,60)
    it("correctly gives rarity R", testRarity([999060n], [3n])) // [60,80)
    it("correctly gives rarity R", testRarity([999079n], [3n]))
    it("correctly gives rarity SR", testRarity([999080n], [2n])) // [80-90)
    it("correctly gives rarity SR", testRarity([999089n], [2n])) //
    it("correctly gives rarity SSR", testRarity([999090n], [1n])) // [90,98)
    it("correctly gives rarity SSR", testRarity([999097n], [1n])) //
    it("correctly gives rarity UR", testRarity([999098n], [0n])) // [98,100)
    it("correctly gives rarity UR", testRarity([999099n], [0n]))
  })

  describe("Percentages whit zero in the 1st position", function () {
    before("Pause and set percentages [0, 10, 10, 20, 60]", async function () {
      await gachaPool.pause()
      await gachaPool.setPercentage([0, 10, 10, 20, 60])
      await gachaPool.unpause()
    })

    it("correctly gives rarity N", testRarity([999000n], [4n])) // [0,60)
    it("correctly gives rarity N", testRarity([999059n], [4n]))
    it("correctly gives rarity R", testRarity([999060n], [3n])) // [60,80)
    it("correctly gives rarity R", testRarity([999079n], [3n]))
    it("correctly gives rarity SR", testRarity([999080n], [2n])) // [80-90)
    it("correctly gives rarity SR", testRarity([999089n], [2n]))
    it("correctly gives rarity SSR", testRarity([999090n], [1n])) // [90,100)
    it("correctly gives rarity SSR", testRarity([999099n], [1n]))
  })

  describe("Percentages whit zero in the middle", function () {
    before("Pause and set percentages [2, 8, 0, 30, 60]", async function () {
      await gachaPool.pause()
      await gachaPool.setPercentage([2, 8, 0, 30, 60])
      await gachaPool.unpause()
    })

    it("correctly gives rarity N", testRarity([999000n], [4n])) // [0,60)
    it("correctly gives rarity N", testRarity([999059n], [4n]))
    it("correctly gives rarity R", testRarity([999060n], [3n])) // [60,90)
    it("correctly gives rarity R", testRarity([999089n], [3n]))
    it("correctly gives rarity SSR", testRarity([999090n], [1n])) // [90,98)
    it("correctly gives rarity SSR", testRarity([999097n], [1n]))
    it("correctly gives rarity UR", testRarity([999098n], [0n])) // [98,100)
    it("correctly gives rarity UR", testRarity([999099n], [0n]))
  })

  describe("Percentages whit zero at the end", function () {
    before("Pause and set percentages [2, 8, 0, 90, 0]", async function () {
      await gachaPool.pause()
      await gachaPool.setPercentage([2, 8, 0, 90, 0])
      await gachaPool.unpause()
    })

    it("correctly gives rarity R", testRarity([999000n], [3n])) // [0,90)
    it("correctly gives rarity R", testRarity([999089n], [3n]))
    it("correctly gives rarity SSR", testRarity([999090n], [1n])) // [90,98)
    it("correctly gives rarity SSR", testRarity([999097n], [1n]))
    it("correctly gives rarity UR", testRarity([999098n], [0n])) // [98,100)
    it("correctly gives rarity UR", testRarity([999099n], [0n]))
  })

  describe("Percentages whit only 100% UR", function () {
    before("Pause and set percentages [100, 0, 0, 0, 0]", async function () {
      await gachaPool.pause()
      await gachaPool.setPercentage([100, 0, 0, 0, 0])
      await gachaPool.unpause()
    })

    it("correctly gives rarity UR", testRarity([999000n], [0n])) // [0,100)
    it("correctly gives rarity UR", testRarity([999050n], [0n]))
    it("correctly gives rarity UR", testRarity([999099n], [0n]))
  })

  describe("Percentages whit only 100% UR", function () {
    before("Pause and set percentages [0, 0, 0, 0, 100]", async function () {
      await gachaPool.pause()
      await gachaPool.setPercentage([0, 0, 0, 0, 100])
      await gachaPool.unpause()
    })

    it("correctly gives rarity N", testRarity([999000n], [4n])) // [0,100)
    it("correctly gives rarity N", testRarity([999050n], [4n]))
    it("correctly gives rarity N", testRarity([999099n], [4n]))
  })
})
