import { useEffect, useState } from "react";
import { watchContractEvent } from "wagmi/actions";
import { config } from "@/common/config";
import { ABI, CA } from "@/public/GachaPoolContract";

// 监听随机数 Fulfill 的组件
function WatchFulfill({ reqId, setCurrStep }) {
  console.log("render WatchFulfill");
  const [watched, setWatched] = useState(false);
  const [done, setDone] = useState(false);

  // 监听 RandomFulfilled 事件
  useEffect(() => {
    if (!watched) {
      const unwatch = watchContractEvent(config, {
        address: CA,
        abi: ABI,
        eventName: "RandomFulfilled",
        onLogs(logs) {
          console.log("New RandomFulfilled logs!");
          const _reqId = logs[0]?.args.requestId;
          console.log("RandomFulfilled reqId", _reqId);
          if (_reqId == reqId) {
            // 收到了期望的 RandomFulfilled
            setDone(true);
            // 停止监听
            unwatch();
          }
        },
        pollingInterval: 1_000,
      });
      setWatched(true);
    }
  }, []);

  // 更新为下一步骤
  if (done) setCurrStep(4);
  return done ? <p>✅</p> : <span className="loading loading-spinner loading-md  text-secondary"></span>;
}

export function GachaStepThree({ reqId, currStep, setCurrStep }) {
  return (
    <li>
      <p>等待随机数 fulfill</p>
      {/* 这个应该在进入第二步之后就开始监听，否则可能会错过 */}
      {currStep >= 2 && reqId != 0 && <WatchFulfill reqId={reqId} setCurrStep={setCurrStep} />}
    </li>
  );
}
