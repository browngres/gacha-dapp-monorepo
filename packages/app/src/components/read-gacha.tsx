import { useReadContracts } from "wagmi";
import { readContracts } from "wagmi/actions";
import { config } from "@/common/config";
import { CA, ABI } from "@/public/GachaPoolContract";

export function usePoolInfo() {
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

export async function getPoolInfo() {
  const [_poolId, _costGwei, _percentages, _discountGachaTen] = await readContracts(config, {
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
  const poolId = _poolId.status === "success" ? _poolId.result : 0;
  const costGwei = _costGwei.status === "success" ? _costGwei.result : 0n;
  const percentages = _percentages.status === "success" ? _percentages.result : [, , , ,];
  const discountGachaTen = _discountGachaTen.status === "success" ? _discountGachaTen.result : 0;

  return { poolId, costGwei, percentages, discountGachaTen };
}
