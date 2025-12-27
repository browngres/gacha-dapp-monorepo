import { useEffect } from "react";
import { fromHex, parseUnits } from "viem";
import { useTransactionReceipt, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ABI, CA } from "@/public/GachaPoolContract";
import { usePoolInfo } from "./read-gacha";

export function GachaStepOne({ isTen, currStep, setCurrStep, reqId, setReqId }) {
  console.log("render GachaStepOne");
  const gacha = useWriteContract();
  const { poolConfig } = usePoolInfo();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!poolConfig) {
      throw new Error("No poolConfig");
    }
    setCurrStep(1);
    // 计算费用
    const txValue = isTen
      ? parseUnits(((10n * poolConfig.costGwei * BigInt(poolConfig.discountGachaTen)) / 100n).toString(), 9)
      : parseUnits(poolConfig.costGwei.toString(), 9);
    // 提交抽卡交易
    gacha.mutateAsync({
      address: CA,
      abi: ABI,
      functionName: isTen ? "gachaTen" : "gachaOne",
      value: txValue,
    });
  }

  const { isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash: gacha.data });

  function ReqId() {
    // 从 tx 获得 reqId
    const txReceipt = useTransactionReceipt({
      hash: gacha.data,
      query: {
        // 只有等到 gacha.data 有东西才能请求
        enabled: !!gacha.data,
      },
    });
    const logs = txReceipt.data?.logs;

    useEffect(() => {
      if (txReceipt.isSuccess) {
        const _reqId = fromHex(logs![2]!.data, "bigint");
        setReqId(_reqId);
        setCurrStep(2);
      }
    }, [txReceipt.isSuccess]);

    return !txReceipt.isSuccess ? (
      <p>
        ReqId: <span className="loading loading-infinity loading-sm"></span>
      </p>
    ) : (
      <div> ReqId: {reqId}</div>
    );
  }

  return (
    <li>
      <form onSubmit={submit}>
        {isTen ? (
          <button className="btn btn-soft btn-success" type="submit" disabled={gacha.isPending || currStep > 1}>
            十连
          </button>
        ) : (
          <button className="btn btn-soft btn-warning" type="submit" disabled={gacha.isPending || currStep > 1}>
            单抽
          </button>
        )}
        抽卡+等待交易结果
        {gacha.data && <p className="wrap-anywhere text-[12px]">Transaction Hash: {gacha.data}</p>}
        {txSuccess && <div> Transaction confirmed. </div>}
        {currStep >= 1 && txSuccess && <ReqId />}
      </form>
    </li>
  );
}
