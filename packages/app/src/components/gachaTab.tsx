import { type BaseError } from "wagmi";

import { formatUnits } from "viem";
import { getPoolInfo } from "./read-gacha";
import { useEffect, useState } from "react";
import { GachaStepOne } from "./gacha-step-one";

export function PoolInfoCard({ setIsBlurred, setIsTen }) {
  // 卡池展示
  // TODO 将来从 pool manager 读取 pool 信息
  const { data, error, isPending, isSuccess } = getPoolInfo();
  const [_poolId, _costGwei, _percentages, _discountGachaTen] = data || [];
  
  if (isPending)
    return (
      <div>
        <span className="loading loading-bars loading-xl"></span> Loading...
      </div>
    );
  if (error) return <div>Error: {(error as BaseError).shortMessage || error.message}</div>;

  const poolId = isSuccess ? _poolId.result.toString() : "";
  const cost = isSuccess ? formatUnits(_costGwei.result, 9) : "";
  const percentages = isSuccess ? _percentages.result : [0, 0, 0, 0, 0];

  const discountGachaTen = isSuccess ? _discountGachaTen.result.toString() : "";

  return (
    <div className="card flex-none bg-base-100 w-96 shadow-sm px-1 card-dash">
      <figure className="py-1">
        <img src="https://picsum.photos/id/56/300/200" />
      </figure>

      <div className="card-body">
        <h2 className="card-title">
          GachaPool
          <div className="badge badge-secondary">ID: {poolId}</div>
        </h2>
        <div>
          Gacha One costs <span className="badge badge-soft badge-neutral">{cost} ETH</span>
        </div>
        <p>A card component has a figure, a body part, and inside body there are title and actions parts</p>
        {/* 稀有度展示 */}
        <div className="join bg-base-100 border-base-300 border rounded-field">
          {percentages[0] !== 0 && (
            <div className="stat">
              <div className="stat-value text-lg">UR</div>
              <div className="stat-desc">{percentages[0]}%</div>
            </div>
          )}
          {percentages[1] !== 0 && (
            <div className="stat">
              <div className="stat-value text-lg">SSR</div>
              <div className="stat-desc">{percentages[1]}%</div>
            </div>
          )}
          {percentages[2] !== 0 && (
            <div className="stat">
              <div className="stat-value text-lg">SR</div>
              <div className="stat-desc">{percentages[2]}%</div>
            </div>
          )}
          {percentages[3] !== 0 && (
            <div className="stat">
              <div className="stat-value text-lg">R</div>
              <div className="stat-desc">{percentages[3]}%</div>
            </div>
          )}
          {percentages[4] !== 0 && (
            <div className="stat">
              <div className="stat-value text-lg">N</div>
              <div className="stat-desc">{percentages[4]}%</div>
            </div>
          )}
        </div>
        <progress className="progress w-56 mx-auto" value={0} max="100"></progress>
        {/* 单抽、十连按钮 */}
        <div className="card-actions flex justify-between my-2 mx-6">
          <button
            className="btn"
            onClick={() => {
              document!.getElementById("gacha_hint_modal")!.showModal();
              setIsTen(false);
            }}
          >
            GachaOne
          </button>
          {/* 消息提示框 */}
          <dialog id="gacha_hint_modal" className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Hello!</h3>
              <p className="py-4">请在按照右侧继续操作</p>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => setIsBlurred(false)}>close</button>
            </form>
          </dialog>

          <div className="indicator">
            <span className="indicator-item badge badge-soft badge-success italic">
              {100 - Number(discountGachaTen)}% off!
            </span>
            <button
              className="btn btn-accent"
              onClick={() => {
                document!.getElementById("gacha_hint_modal")!.showModal();
                setIsTen(true);
              }}
            >
              GachaTen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GachaWorkflow({ isBlurred, isTen }) {
  // 抽卡流程
  const [currStep, setCurrStep] = useState(0);

  return (
    <div className={`card grow bg-base-100 shadow-sm ${isBlurred && "blur-sm pointer-events-none select-none"}`}>
      <div className="card-body flex-row">
        {/* 进度条 */}
        <ul className="steps steps-vertical h-full w-1/3 font-bold">
          <li className={`step ${currStep > 0 && "step-primary"}`}>
            <span>Gacha</span>
          </li>
          <li className={`step ${currStep > 1 && "step-primary"}`}>
            <span>Signature</span>
          </li>
          <li className={`step ${currStep > 2 && "step-primary"}`}>
            <span>Fulfill VRF</span>
          </li>
          <li className={`step ${currStep > 3 && "step-primary"}`}>
            <span>Get Result</span>
          </li>
        </ul>
        {/* 右侧内容 */}
        <ul className="grid grid-rows-4 place-items-center">
          <GachaStepOne isTen={isTen} />
          <li>等待后端返回签名</li>
          <li>等待随机数 fulfill（读取 event RandomFulfilled）</li>
          <li>显示抽卡结果</li>
        </ul>
      </div>
    </div>
  );
}

export function GachaTab() {
  const [isBlurred, setIsBlurred] = useState<boolean>(true);
  const [isTen, setIsTen] = useState<boolean>(false);

  return (
    <div className="container flex">
      {/* 卡池展示 */}
      <PoolInfoCard setIsBlurred={setIsBlurred} setIsTen={setIsTen} />
      {/* 抽卡流程 */}
      <GachaWorkflow isBlurred={isBlurred} isTen={isTen} key={Number(isTen)} />
    </div>
  );
}
