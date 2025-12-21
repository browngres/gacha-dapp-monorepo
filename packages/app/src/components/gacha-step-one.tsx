import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { getPoolInfo } from "./read-gacha";
import { ABI, CA } from "@/public/GachaPoolContract";

export function GachaStepOne({ isTen, setCurrStep, reqId }) {
  // 计算 value
  let txValue = 0n;

  console.log("render GachaStepOne");

  const gacha = useWriteContract();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // 计算费用
    const { costGwei, discountGachaTen } = (await getPoolInfo()) || [];
    setCurrStep(1);
    txValue = isTen
      ? parseUnits(((10n * costGwei * BigInt(discountGachaTen)) / 100n).toString(), 9)
      : parseUnits(BigInt(costGwei).toString(), 9);
    // 提交抽卡交易
    gacha.mutateAsync({
      address: CA,
      abi: ABI,
      functionName: isTen ? "gachaTen" : "gachaOne",
      value: txValue,
    });
  }

  const { isSuccess } = useWaitForTransactionReceipt({ hash: gacha.data });
  if (isSuccess) setCurrStep(2);

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
        抽卡+等待交易结果
        {gacha.data && <p className="wrap-anywhere text-[12px]">Transaction Hash: {gacha.data}</p>}
        {isSuccess && <div>Transaction confirmed. ReqId: {reqId} </div>}
      </li>
    </form>
  );
}
