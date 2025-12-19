import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { CA, ABI } from "../public/GachaPoolContract";

export function ReadCost() {
  const { data: costGwei } = useReadContract({
    address: CA,
    abi: ABI,
    functionName: "costGwei",
    args: [],
  });
  const cost = costGwei ? formatUnits(costGwei, 9) : "";
  return <div>Gacha One costs {cost} ETH</div>;
}
