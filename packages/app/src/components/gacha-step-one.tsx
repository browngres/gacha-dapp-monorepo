import { parseUnits } from "viem";
import { getPoolInfo } from "./read-gacha";
import { BaseError, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ABI, CA } from "@/public/GachaPoolContract";
import { useState } from "react";

export function GachaStepOne({ isTen }) {
  const { data, isSuccess: poolInfoSuccess } = getPoolInfo();
  const [_, costGwei, __, discount] = data || [];

  let txValue = 0n;
  if (poolInfoSuccess) {
    txValue = isTen
      ? parseUnits(((10n * costGwei.result * BigInt(discount.result)) / 100n).toString(), 9)
      : parseUnits(BigInt(costGwei.result).toString(), 9);
  }

  const gacha = useWriteContract();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    gacha.mutateAsync({
      address: CA,
      abi: ABI,
      functionName: isTen ? "gachaTen" : "gachaOne",
      value: txValue,
    });
  }

  const { isSuccess } = useWaitForTransactionReceipt({ hash: gacha.data });

  return (
    <form onSubmit={submit}>
      <li>
        {isTen ? (
          <button className="btn btn-soft btn-success" type="submit" disabled={gacha.isPending}>
            十连
          </button>
        ) : (
          <button className="btn btn-soft btn-warning" type="submit" disabled={gacha.isPending}>
            单抽
          </button>
        )}
        抽卡+等待交易结果（读取 event gachaOne）
        {gacha.data && <div>Transaction Hash: {gacha.data}</div>}
        {isSuccess && <div>Transaction confirmed.</div>}
      </li>
    </form>
  );
}
