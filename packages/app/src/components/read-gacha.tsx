import { formatUnits } from "viem";
import { useReadContracts } from "wagmi";
import { CA, ABI } from "../public/GachaPoolContract";

export function getPoolInfo() {
  const { data, error, isPending, isSuccess } = useReadContracts({
    contracts: [
      {
        address: CA,
        abi: ABI,
        functionName: "poolId",
      },
      {
        address: CA,
        abi: ABI,
        functionName: "costGwei",
      },
      {
        address: CA,
        abi: ABI,
        functionName: "percentages",
      },
      {
        address: CA,
        abi: ABI,
        functionName: "discountGachaTen",
      },
    ],
  });
  return { data, error, isPending, isSuccess };
}
