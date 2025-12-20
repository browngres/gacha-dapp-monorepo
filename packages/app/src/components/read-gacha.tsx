import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { CA, ABI } from "../public/GachaPoolContract";

export function GachaCost() {
  const { data: costGwei } = useReadContract({
    address: CA,
    abi: ABI,
    functionName: "costGwei",
  });
  const cost = costGwei ? formatUnits(costGwei, 9) : "";
  return cost;
}
