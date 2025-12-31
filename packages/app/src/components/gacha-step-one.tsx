import { useEffect, useState } from "react";
import { fromHex, parseUnits, BaseError } from "viem";
import { useSimulateContract, useTransactionReceipt, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ABI, CA } from "@/public/GachaPoolContract";
import { usePoolInfo } from "./read-gacha";

export function GachaStepOne({ isTen, currStep, setCurrStep, reqId, setReqId, setTxHash }) {
  console.log("render GachaStepOne");

  const [errorModal, setErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const gacha = useWriteContract();
  const gacha_simulate = useSimulateContract(
    // 模拟一下单抽交易能否成功
    {
      address: CA,
      abi: ABI,
      functionName: "gachaOne",
      value: parseUnits("0.1", 18),
    },
  );
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

    try {
      // 模拟单抽交易需要成功
      if (!gacha_simulate.data) {
        throw new BaseError("GachaOne Tx simulate failed");
      }
      // 提交抽卡交易
      await gacha.mutateAsync({
        address: CA,
        abi: ABI,
        functionName: isTen ? "gachaTen" : "gachaOne",
        value: txValue,
      });
    } catch (error: any) {
      console.error("Transaction failed:", error);
      // 解析错误消息
      if (error instanceof BaseError) {
        // 用户拒绝
        if (error.shortMessage?.includes("User rejected")) {
          setErrorMessage("User rejected the transaction");
        }
        // Gas 不足
        else if (error.shortMessage?.includes("insufficient funds")) {
          setErrorMessage("Insufficient funds for gas");
        }
        // 其他错误
        else {
          setErrorMessage(error.shortMessage || "Transaction failed");
        }
      }
      setErrorModal(true);
    }
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
        setTxHash(gacha.data);
        if (currStep == 1) setCurrStep(2); // 防止 step 抖动
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
        {gacha.isPending && <span className="loading loading-spinner loading-md text-secondary"></span>}
        {gacha.data && <p className="wrap-anywhere text-[12px]">Transaction Hash: {gacha.data}</p>}
        {txSuccess && <div> Transaction confirmed. </div>}
        {currStep >= 1 && txSuccess && <ReqId />}
      </form>
      {/* Error Modal */}
      {errorModal && (
        <dialog open className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Transaction Failed</h3>
            <p className="py-4">{errorMessage}</p>
            <div className="modal-action">
              <button className="btn" onClick={() => setErrorModal(false)}>
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setErrorModal(false)}></button>
          </form>
        </dialog>
      )}
    </li>
  );
}
