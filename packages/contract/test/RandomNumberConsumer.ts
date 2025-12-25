// 修改自 https://github.com/smartcontractkit/hardhat-starter-kit/blob/main/test/unit/RandomNumberConsumer.spec.js
import { assert, expect } from "chai"

import { network } from "hardhat"
const { ethers, networkHelpers } = await network.connect()

describe("Random Number Consumer Unit Tests", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployRandomNumberConsumerFixture() {
    // 部署 VRFCoordinator
    const BASE_FEE = ethers.parseEther("0.001") // 0.001 ether as base fee
    const GAS_PRICE = ethers.parseUnits("50", "gwei") // 50 gwei
    const WEI_PER_UNIT_LINK = ethers.parseEther("0.01") // 0.01 ether per LINK

    const VRFCoordinatorMock = await ethers.deployContract("VRFCoordinatorV2_5Mock", [
      BASE_FEE,
      GAS_PRICE,
      WEI_PER_UNIT_LINK,
    ])

    // 存款并订阅
    const fundAmount = ethers.parseEther("1") // 1 ether
    const tx = await VRFCoordinatorMock.createSubscription()
    const txReceipt = await tx.wait(1)
    const subscriptionId = BigInt(txReceipt!.logs[0].topics[1])
    // console.log("log:",txReceipt.logs);
    // console.log("subscriptionId:",subscriptionId);

    await VRFCoordinatorMock.fundSubscription(subscriptionId, fundAmount)
    // 部署 Consumer
    const keyHash = "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc" // 随意，mock 中没用
    const consumer = await ethers.deployContract("RandomConsumer", [subscriptionId, VRFCoordinatorMock.target, keyHash])
    await VRFCoordinatorMock.addConsumer(subscriptionId, consumer.target)

    return { consumer, VRFCoordinatorMock }
  }
  describe("#requestRandomWords", function () {
    it("Should successfully request a random number", async function () {
      const { consumer, VRFCoordinatorMock } = await networkHelpers.loadFixture(deployRandomNumberConsumerFixture)
      await expect(consumer.requestRandomWords()).to.emit(VRFCoordinatorMock, "RandomWordsRequested")
    })

    it("Should successfully request a random number and get a result", async function () {
      const { consumer, VRFCoordinatorMock } = await networkHelpers.loadFixture(deployRandomNumberConsumerFixture)
      await consumer.requestRandomWords()
      const requestId = await consumer.s_requestId()

      // simulate callback from the oracle network
      await expect(VRFCoordinatorMock.fulfillRandomWords(requestId, consumer.target)).to.emit(
        consumer,
        "ReturnedRandomness",
      )

      const firstRandomNumber = await consumer.s_randomWords(0)
      const secondRandomNumber = await consumer.s_randomWords(1)
      console.log("firstRandomNumber:", firstRandomNumber)
      console.log("secondRandomNumber:", secondRandomNumber)
      assert.notEqual(firstRandomNumber, 0n, "firstRandomNumber is 0")
      assert.notEqual(secondRandomNumber, 0n, "secondRandomNumber is 0")
    })

    it("Should successfully fire event on callback", async function () {
      const { consumer, VRFCoordinatorMock } = await networkHelpers.loadFixture(deployRandomNumberConsumerFixture)

      await new Promise<void>(async (resolve, reject) => {
        consumer.once(consumer.getEvent("ReturnedRandomness"), async () => {
          console.log("Consumer's ReturnedRandomness event fired!")
          const firstRandomNumber = await consumer.s_randomWords(0)
          const secondRandomNumber = await consumer.s_randomWords(1)
          // assert throws an error if it fails, so we need to wrap
          // it in a try/catch so that the promise returns event
          // if it fails.
          try {
            assert.notEqual(firstRandomNumber, 0n, "firstRandomNumber is 0")
            assert.notEqual(secondRandomNumber, 0n, "secondRandomNumber is 0")
            resolve()
          } catch (e) {
            reject(e)
          }
        })
        await consumer.requestRandomWords()
        const requestId = await consumer.s_requestId()
        VRFCoordinatorMock.fulfillRandomWords(requestId, consumer.target)
      })
    })
  })
})
