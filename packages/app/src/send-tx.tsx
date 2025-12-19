import * as React from "react";
import { type BaseError, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";

export function SendTransaction() {
  const sendTransaction = useSendTransaction();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const to = formData.get("address") as `0x${string}`;
    const value = formData.get("value") as string;
    sendTransaction.mutate({ to, value: parseEther(value) });
  }

  const result = useWaitForTransactionReceipt({ hash: sendTransaction.data });

  return (
    <form onSubmit={submit}>
      <input className='input' name='address' placeholder='0xA0Cf…251e' required />
      <input className='input' name='value' placeholder='0.05' required />
      <button className='btn' disabled={sendTransaction.isPending} type='submit'>
        {sendTransaction.isPending ? "Confirming..." : "Send"}
      </button>
      {sendTransaction.data && <div className='alert alert alert-info'>Transaction Hash: {sendTransaction.data}</div>}
      {result.isLoading && <div className='alert alert-info'>Waiting for confirmation...</div>}
      {result.isSuccess && <div className='alert alert-success'>Transaction confirmed.</div>}
      {sendTransaction.error && (
        <div className='alert'>
          Error: {(sendTransaction.error as BaseError).shortMessage || sendTransaction.error.message}
        </div>
      )}
    </form>
  );
}
