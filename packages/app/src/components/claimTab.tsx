import type { Address } from "viem";
import { useState } from "react";
import { useConnection } from "wagmi";
import { useRequests } from "./read-gacha";
import { useQuery } from "wagmi/query";

export function ClaimTab() {
  const [reqId, setReqId] = useState<bigint>(0n);

  function RequestsList() {
    // 请求玩家抽卡记录
    const connection = useConnection();
    const user = connection.address;
    const { data, error: requestsError, isPending: requestPending } = useRequests(user!);
    const requests = data || [];

    // 获取地址已经 claimed 的记录

    async function fetchClaimed(): Promise<bigint[]> {
      try {
        console.log("发出了一次 fetchClaimed 请求");
        const response = await fetch("/api/claimed/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ who: user }),
        });

        if (response.ok) {
          const claimedList = await response.json();
          return [1n, 2n, 3n];
          // TODO return claimedList.data;
        }
        if (response.status == 400) {
          return Promise.reject(new Error("FetchClaimed Failed"));
        }
      } catch (error) {
        console.error(error);
        return Promise.reject(new Error("FetchClaimed Failed"));
      }
      return [0n];
    }

    // 请求签名的 Query
    const claimQuery = useQuery({ queryKey: ["claimed", user], queryFn: fetchClaimed, staleTime: 2 * 60 * 1000 });


    const listItems = requests.map((reqId) => <button className="btn btn-outline btn-sm">{reqId}</button>);
    return <div className="grid grid-cols-10 gap-3 px-8 my-1">{listItems}</div>;
  }

  // TODO claim  tx 之后 refetch claimed
  //  claimQuery.refetch()


  return (
    <div className="container min-h-80">
      <span className="text-rotate text-4xl duration-4000">
        <span className="justify-items-center">
          <span>CLAIM</span>
          <span>YOUR</span>
          <span>GACHA</span>
          <span>CARD</span>
        </span>
      </span>
      <div className="divider"></div>

      <div>我的抽卡记录：</div>

      <RequestsList />

      <input
        type="number"
        className="input validator"
        required
        placeholder="Type a number between 1 to 10"
        min="1"
        max="10"
        title="Must be between be 1 to 10"
      />
      <p className="validator-hint">Must be between be 1 to 10</p>
    </div>
  );
}

// function handleTextareaChange(e) {
//   setAnswer(e.target.value);
// }
