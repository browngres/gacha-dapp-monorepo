import { parseUnits } from "viem";
import { getPoolInfo } from "./read-gacha";
import { BaseError, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ABI, CA } from "@/public/GachaPoolContract";
import { useState } from "react";

export function GachaStepOne({ isTen }) {
  const [hash, setHash] = useState<`0x${string}`>("0x");
  const [pending, setPending] = useState<boolean>(false);

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
    setHash(gacha.data!);
    console.log(hash);
    setPending(gacha.isPending);
  }

  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  return (
    <form onSubmit={submit}>
      <li>
        {isTen ? (
          <button className="btn btn-soft btn-success" type="submit" disabled={pending}>
            十连
          </button>
        ) : (
          <button className="btn btn-soft btn-warning" type="submit" disabled={pending}>
            单抽
          </button>
        )}
        抽卡+等待交易结果（读取 event gachaOne）
        {hash && <div>Transaction Hash: {hash}</div>}
        {gacha.error && <div>Error: {(gacha.error as BaseError).shortMessage || gacha.error.message}</div>}
        {isSuccess && <div>Transaction confirmed.</div>}
      </li>
    </form>
  );
}
