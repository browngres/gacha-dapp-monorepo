import { useGachaResult } from "./read-gacha";
import { RARITY } from "@/public/GachaPoolContract";

export function GachaStepFour({ reqId, currStep }) {
  console.log("render GachaStepFour");
  function Result() {
    // 读取结果的组件
    console.log("render Result");

    const { data, error, isLoading } = useGachaResult(reqId);

    const [_, __, rarity] = data || [];

    // 映射每个稀有度结果为组件
    function MapRarity({ rarity }: { rarity: readonly number[] }) {
      const listItems = rarity.map((r) => (
        <label className="swap swap-flip mx-1">
          <input type="checkbox" />
          <div className="swap-off text-4xl">🎄</div>
          <div className="swap-on text-2xl pt-2">{RARITY[r]}</div>
        </label>
      ));
      return <div className="max-w-3/4 mx-auto pt-2">{listItems}</div>;
    }

    return (
      <>
        {isLoading ? (
          <span className="loading loading-spinner loading-md text-secondary"></span>
        ) : !!error ? (
          <div> Error: {error.shortMessage || error.message} </div>
        ) : (
          <MapRarity rarity={rarity!} />
        )}
      </>
    );
  }

  return (
    <li>
      <p>抽卡结果，点击 Emoji 翻转</p>
      {currStep == 4 && reqId != 0 && <Result />}
    </li>
  );
}
