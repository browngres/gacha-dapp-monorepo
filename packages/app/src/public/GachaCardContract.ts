export const CA = "0x44F5d0EB727a963aa0edC3C5b1D916EfB9340905"
//abi (only using)
export const ABI = [
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "getRarity",
    outputs: [{ internalType: "uint8", name: "rarity", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "tokensOf",
    outputs: [{ internalType: "uint256[]", name: "result", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
] as const
