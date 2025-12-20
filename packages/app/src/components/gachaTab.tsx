import { useReadContracts, type BaseError } from "wagmi";

import { CA, ABI } from "../public/GachaPoolContract";
import { formatUnits } from "viem";

export function PoolInfoCard() {
  // TODO 将来从 pool manager 读取 pool 信息
  const { data, error, isPending } = useReadContracts({
    contracts: [
      {
        address: CA,
        abi: ABI,
        functionName: "poolId",
      },
      {
        address: CA,
        abi: ABI,
        functionName: "costGwei",
      },
      {
        address: CA,
        abi: ABI,
        functionName: "percentages",
      },
      {
        address: CA,
        abi: ABI,
        functionName: "discountGachaTen",
      },
    ],
  });

  const [_poolId, _costGwei, _percentages, _discountGachaTen] = data || [];
  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as BaseError).shortMessage || error.message}</div>;

  const poolId = _poolId?.status == "success" ? _poolId.result.toString() : "";
  const cost = _costGwei?.status == "success" ? formatUnits(_costGwei.result, 9) : "";
  const percentages = _percentages?.status == "success" ? _percentages.result : [0, 0, 0, 0, 0];

  const discountGachaTen = _discountGachaTen?.status == "success" ? _discountGachaTen.result.toString() : "";

  return (
    <div className="card bg-base-100 w-96 shadow-sm px-1 card-dash">
      <figure>
        <img src="https://picsum.photos/id/56/300/200" alt="Shoes" />
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
        <div>discountGachaTen: {discountGachaTen}</div>
        <div className="card-actions flex justify-between my-2 mx-6">
          <button className="btn btn-primary">GachaOne</button>
          <button className="btn btn-accent">GachaTen</button>
        </div>
      </div>
    </div>
  );
}

export function GachaTab() {
  return <PoolInfoCard />;
}
