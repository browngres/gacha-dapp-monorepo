import { useEffect, useState, type FormEvent } from "react";
import { BaseError, useWriteContract, useWaitForTransactionReceipt, useConnection } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "wagmi/query";
import { ABI, CA } from "@/public/GachaPoolContract";

export function ClaimForm({ poolId, reqId, setReqId }) {
  const [input, setInput] = useState<string>("");
  const ClaimTx = useWriteContract();
  const connection = useConnection();
  const user = connection.address;

  // 输入框单向获取 reqId 值
  useEffect(() => {
    setInput(reqId);
  }, [reqId]);

  function getSignatureCookie(pool: number, reqId: bigint): string {
    const pattern = new RegExp(`Gacha_${pool}_${reqId}_signature=(0x[0-9a-fA-F]+?)(?:;|$)`);
    const match = pattern.exec(document.cookie);
    return match ? decodeURIComponent(match[1]!) : "0x";
  }

  async function putClaimed() {
    // 通知后端 claim 成功
    console.log("发出了一次 putClaimed 请求");
    try {
      const response = await fetch("/api/claimed/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: user, requestId: Number(reqId) }),
      });
      if (!response.ok) {
        throw new Error("putClaimed Failed");
      }
      return await response.json();
    } catch (error) {
      console.error("putClaimed", error);
      throw new Error("putClaimed Failed");
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const reqId = BigInt(formData.get("reqId") as string);
    // 从 cookie 中获取签名
    let signature = getSignatureCookie(poolId, reqId);
    if (signature == "0x") {
      // TODO 向后端查询签名
      signature = "0x123";
    }
    console.log("提交的 signature ", signature);

    try {
      // 提交抽卡交易
      await ClaimTx.mutateAsync({
        address: CA,
        abi: ABI,
        functionName: "claim",
        args: [reqId, signature as `0x${string}`],
      });
    } catch (error: any) {
      console.error("Transaction failed:", error);
    }
  }

  const ClaimTxReceipt = useWaitForTransactionReceipt({ hash: ClaimTx.data });

  // 告诉后端已经 claimed
  const PutClaimedQuery = useQuery({
    queryKey: ["claimed", poolId, reqId],
    queryFn: putClaimed,
    staleTime: 2 * 60 * 1000,
    enabled: ClaimTxReceipt.isSuccess,
  });
  console.log("claimedQuery.isSuccess", PutClaimedQuery.isSuccess);

  // Claim 成功后重新获取 claimed 列表
  const queryClient = useQueryClient();
  useEffect(() => {
    if (ClaimTxReceipt.isSuccess) {
      console.log("refetch claimed list");
      queryClient.invalidateQueries({ queryKey: ["claimed", user] });
    }
  }, [ClaimTxReceipt.isSuccess]);

  return (
    <form onSubmit={submit}>
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-sm mx-auto p-4">
        <legend className="fieldset-legend">Claim</legend>
        <label className="label">ReqId</label>
        <div className="join my-2">
          <input
            type="number"
            className="input join-item validator text-nowrap"
            required
            placeholder="Must be between 1 to 100"
            min="1"
            max="100"
            name="reqId"
            title="Must be between 1 to 100"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn btn-primary join-item" disabled={ClaimTx.isPending} type="submit">
            Claim
          </button>
        </div>
        {ClaimTx.data && <div className="alert alert-soft alert-info text-xs">Transaction: {ClaimTx.data}</div>}
        {ClaimTxReceipt.isLoading && <div className="alert alert-soft text-xs">Waiting for confirmation...</div>}
        {ClaimTxReceipt.isSuccess && <div className="alert alert-soft text-xs">Transaction confirmed.</div>}
        {ClaimTx.error && (
          <div className="alert alert-soft alert-error">
            Error: {(ClaimTx.error as BaseError).shortMessage || "Transaction failed"}
          </div>
        )}
      </fieldset>
    </form>
  );
}
