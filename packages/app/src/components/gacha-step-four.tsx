import { ABI, CA } from "@/public/GachaPoolContract";
import { useReadContract } from "wagmi";

// 读取结果的组件
function Result({ reqId }) {
  console.log("render Result");
  const result = useReadContract({
    address: CA,
    abi: ABI,
    functionName: "getResult",
    args: [reqId],
    query: {
      enabled: !!reqId,
    },
  });

  const [_, __, rarity] = result.data || [];
  return (
    <>
      {result.isLoading ? (
        <span className="loading loading-spinner loading-md text-secondary"></span>
      ) : result.isError ? (
        <div> Error: {result.error.shortMessage || result.error.message} </div>
      ) : (
        <div>{rarity}</div>
      )}
    </>
  );
}

export function GachaStepFour({ reqId, currStep }) {
  return (
    <li>
      <p> 抽卡结果</p>
      {currStep == 4 && reqId != 0 && <Result reqId={reqId} />}
    </li>
  );
}
