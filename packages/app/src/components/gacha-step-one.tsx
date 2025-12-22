import { useEffect, useState } from "react";
import { parseUnits } from "viem";
import { useConnection, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { watchContractEvent } from "wagmi/actions";
import { ABI, CA } from "@/public/GachaPoolContract";
import { config } from "@/common/config";
import { getPoolInfo } from "./read-gacha";

export function GachaStepOne({ isTen, currStep, setCurrStep, reqId, setReqId }) {
  console.log("render GachaStepOne");
  const [watchedReqId, setWatchedReqId] = useState(false);
  const gacha = useWriteContract();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // 计算费用
    const { costGwei, discountGachaTen } = (await getPoolInfo()) || [];
    setCurrStep(1);
    const txValue = isTen
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

  function ReqId() {
    // 监听 GachaOne 事件获取 reqId
    const connection = useConnection();
    useEffect(() => {
      if (!watchedReqId) {
        const unwatch = watchContractEvent(config, {
          address: CA,
          abi: ABI,
          eventName: "GachaOne",
          onLogs(logs) {
            console.log("New logs!");
            const reqId = logs[0]?.args.requestId;
            const who = logs[0]?.args.who;
            console.log("address", who);
            console.log("reqId", reqId);
            if (connection.address == who) {
              setReqId(reqId!);
            }
            // 当接收到事件后，停止监听
            unwatch();
          },
          pollingInterval: 1_000,
        });

        setWatchedReqId(true);
      }
    }, []);
    return reqId === 0 ? <p>加载中</p> : <div> ReqId: {reqId}</div>;
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
        {isSuccess && <div> Transaction confirmed. </div>}
        {currStep >= 1 && <ReqId />}
      </form>
    </li>
  );
}
