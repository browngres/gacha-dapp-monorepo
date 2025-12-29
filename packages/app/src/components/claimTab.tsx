import { useEffect, useState } from "react";
import { useConnection } from "wagmi";
import { usePoolInfo, useGachaRequests, useGachaResult } from "./read-gacha";
import { useQuery } from "wagmi/query";

import { ClaimForm } from "./claimForm";
import { RARITY } from "@/public/GachaPoolContract";

export function ClaimTab() {
  const [reqId, setReqId] = useState<bigint>(0n);
  const [poolId, setPoolId] = useState(0);

  const { poolConfig } = usePoolInfo();

  useEffect(() => {
    // 加载 poolId
    if (poolConfig?.poolId !== undefined) {
      setPoolId(poolConfig.poolId);
    }
  }, [poolConfig?.poolId]);

  function RequestsList() {
    // 请求玩家抽卡记录
    const connection = useConnection();
    const user = connection.address;
    const { data, error: requestsError, isPending: requestPending } = useGachaRequests(user!);
    const requests = data || [];

    // 获取地址已经 claimed 的记录
    async function fetchClaimed(): Promise<bigint[]> {
      try {
        console.log("发出了一次 fetchClaimed 请求");
        const response = await fetch("/api/claimed/" + user, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          throw new Error("FetchClaimed Failed");
        }
        const _claimedList :[{requestId:string}] = await response.json();
        const claimedList = _claimedList.map(item => BigInt(item.requestId));
        return claimedList;
      } catch (error) {
        console.error(error);
        throw new Error("FetchClaimed Failed");
      }
    }

    const claimedQuery = useQuery({ queryKey: ["claimed", user], queryFn: fetchClaimed, staleTime: 2 * 60 * 1000 });
    const claimedList = (claimedQuery.data as bigint[]) ?? [];
    console.log("claimedQuery.data", claimedQuery.data);

    const listItems = requests.map((reqId) => (
      // 如果已经 claim, 按钮使用虚线框
      <button
        className={claimedList.includes(reqId) ? "btn btn-dash" : "btn btn-outline"}
        key={reqId}
        onClick={() => setReqId(reqId)}
      >
        {reqId}
      </button>
    ));
    // TODO loading
    return <div className="grid grid-cols-10 gap-3 px-8 my-1">{listItems}</div>;
  }

  function GachaResult({ reqId }) {
    // 加载 reqId 对应结果
    const { data, error, isLoading } = useGachaResult(reqId);
    const [numWords, __, rarity] = data || [0, , []];

    const listItems = rarity.map((r) => (
      <span className="badge badge-outline badge-primary badge-sm gap-2 w-10">{RARITY[r]}</span>
    ));

    return (
      <div className="card w-96 bg-base-100 card-xs shadow-sm mx-auto">
        <div className="card-body min-h-6 place-items-center">
          {isLoading ? (
            <span className="loading loading-spinner loading-md text-secondary"></span>
          ) : !!error ? (
            <div> Error: {error.shortMessage || error.message} </div>
          ) : (
            <div className={`grid grid-cols-${numWords == 1 ? 1 : 5} gap-2 my-2`}>{listItems}</div>
          )}
        </div>
      </div>
    );
  }

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
      <div className="divider"></div>
      <div>抽卡结果展示: {reqId} </div>
      <GachaResult reqId={reqId} />
      <div className="divider"></div>
      <ClaimForm reqId={reqId} setReqId={setReqId} poolId={poolId} key={reqId} />
    </div>
  );
}
