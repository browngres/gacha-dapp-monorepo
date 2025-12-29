import { useEffect, type FormEvent } from "react";
import { BaseError, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQuery } from "wagmi/query";
import { ABI, CA } from "@/public/GachaPoolContract";

export function ClaimForm({ poolId, reqId }) {
  const ClaimTx = useWriteContract();

  function getSignatureCookie(pool: number, reqId: bigint): string {
    const pattern = new RegExp(`Gacha_${pool}_${reqId}_signature=(0x[0-9a-fA-F]+?)(?:;|$)`);
    const match = pattern.exec(document.cookie);
    return match ? decodeURIComponent(match[1]!) : "0x";
  }

  async function postClaimed() {
    // todo
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const reqId = BigInt(formData.get("reqId") as string);
    // 从 cookie 中获取签名
    let signature = getSignatureCookie(poolId, reqId);
    if (signature == "0x") {
      // TODO 向后端请求签名
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

  const claimedQuery = useQuery({
    queryKey: ["claimed", poolId, reqId],
    queryFn: postClaimed,
    staleTime: 2 * 60 * 1000,
  });

  // 告诉后端已经 claimed
  useEffect(() => {
    if (ClaimTxReceipt.isSuccess) {
      // TODO 告诉后端已经 claimed
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
