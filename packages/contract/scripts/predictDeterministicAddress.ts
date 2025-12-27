import { type AddressLike, type BytesLike, getBytes, solidityPackedKeccak256 } from "ethers"

// 计算 CREATE3 地址
// 仿照 https://github.com/transmissions11/solmate/blob/main/src/utils/CREATE3.sol
export default function predictDeterministicAddress(salt: BytesLike, deployer: AddressLike): AddressLike {
  const proxyBytes = solidityPackedKeccak256(
    ["bytes1", "address", "bytes32", "bytes32"],
    [getBytes("0xff"), deployer, salt, "0x21c35dbe1b344a2488cf3321d6ce542f8e9f305544ff09e4993a62319a497c1f"],
  )
  // console.log("proxyBytes", proxyBytes)
  const proxyAddress = "0x" + proxyBytes.substring(26)
  // console.log(proxyAddress)

  const deployed = solidityPackedKeccak256(
    ["bytes", "address", "bytes1"],
    [getBytes("0xd694"), proxyAddress, getBytes("0x01")],
  )
  const deployedAddress = "0x" + deployed.substring(26)

  // console.log("deployedAddress", deployedAddress)
  return deployedAddress
}
