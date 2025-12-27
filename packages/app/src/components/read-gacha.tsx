import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { CA, ABI } from "@/public/GachaPoolContract";

export type PoolConfig =
  | {
      costGwei: bigint;
      poolId: number;
      supply: number;
      discountGachaTen: number;
      guarantee: boolean;
      guaranteeRarity: number;
      percentages: readonly [number, number, number, number, number];
    }
  | undefined;

export function usePoolInfo() {
  const { data, error, isPending, isSuccess } = useReadContract({
    address: CA,
    abi: ABI,
    functionName: "getPoolConfig",
  });
  // 直接从 data 计算，不需要额外的 state
  const poolConfig = useMemo(() => {
    if (!isSuccess || !data) return undefined;

    return {
      costGwei: data[0],
      poolId: data[1],
      supply: data[2],
      discountGachaTen: data[3],
      guarantee: data[4],
      guaranteeRarity: data[5],
      percentages: data[6],
    };
  }, [isSuccess, data]);

  return { poolConfig, error, isPending, isSuccess };
}
