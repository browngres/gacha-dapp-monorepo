import { type FormEvent } from "react";
import { type BaseError, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
export function SendTransaction() {
  const sendTransaction = useSendTransaction();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const to = formData.get("address") as `0x${string}`;
    const value = formData.get("value") as string;
    sendTransaction.mutate({ to, value: parseEther(value) });
  }

  const result = useWaitForTransactionReceipt({ hash: sendTransaction.data });

  return (
    <form onSubmit={submit}>
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
        <legend className="fieldset-legend">Send tx</legend>

        <label className="label">Address</label>
        <input className="input" name="address" placeholder="0xA0Cf…251e" required />

        <label className="label">Value</label>
        <input className="input" name="value" placeholder="0.05" required />
        <button className="btn btn-primary" disabled={sendTransaction.isPending} type="submit">
          {sendTransaction.isPending ? "Confirming..." : "Send"}
        </button>
      </fieldset>
      {sendTransaction.data && <div className="alert alert-soft alert-info">Transaction: {sendTransaction.data}</div>}
      {result.isLoading && <div className="alert alert-soft alert-info">Waiting for confirmation...</div>}
      {result.isSuccess && <div className="alert alert-soft alert-success">Transaction confirmed.</div>}
      {sendTransaction.error && (
        <div className="alert alert-soft alert-error">
          Error: {(sendTransaction.error as BaseError).shortMessage || sendTransaction.error.message}
        </div>
      )}
    </form>
  );
}
