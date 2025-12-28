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

  const rarityNames = ["UR", "SSR", "SR", "R", "N"] as const;

  // 映射每个稀有度结果为组件
  function MapRarity({ rarity }: { rarity: readonly number[] }) {
    const listItems = rarity.map((r) => (
      <label className="swap swap-flip mx-1">
        <input type="checkbox" />
        <div className="swap-off text-4xl">🎄</div>
        <div className="swap-on text-2xl pt-2">{rarityNames[r]}</div>
      </label>
    ));

    return <div className="max-w-3/4 mx-auto pt-2">{listItems}</div>;
  }

  return (
    <>
      {result.isLoading ? (
        <span className="loading loading-spinner loading-md text-secondary"></span>
      ) : result.isError ? (
        <div> Error: {result.error.shortMessage || result.error.message} </div>
      ) : (
        <MapRarity rarity={rarity!} />
      )}
    </>
  );
}

export function GachaStepFour({ reqId, currStep }) {
  console.log("render GachaStepFour");

  return (
    <li>
      <p>抽卡结果，点击 Emoji 翻转</p>
      {currStep == 4 && reqId != 0 && <Result reqId={reqId} />}
    </li>
  );
}
