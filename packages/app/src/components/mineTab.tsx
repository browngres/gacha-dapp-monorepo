import { useMemo } from "react";
import { usePoolInfo } from "./read-gacha";
import { useConnection } from "wagmi";
import { useReadContract, useReadContracts } from "wagmi";
import { CA, ABI } from "@/public/GachaCardContract";

export function MineTab() {
  const { poolConfig } = usePoolInfo();
  const connection = useConnection();
  const user = connection.address;

  // 获取用户的 NFT token ids
  const { data: idListData, isSuccess: idListSuccess } = useReadContract({
    address: CA,
    abi: ABI,
    functionName: "tokensOf",
    args: [user!],
    query: {
      enabled: !!user,
    },
  });

  const tokenIds = useMemo(() => {
    if (!idListSuccess || !idListData) return [];
    return idListData;
  }, [idListData, idListSuccess]);

  // 批量获取 tokenURI
  const uriContracts = useMemo(() => {
    if (!tokenIds.length) return [];
    return tokenIds.map((id) => ({
      address: CA as `0x${string}`,
      abi: ABI,
      functionName: "tokenURI" as const,
      args: [id],
    }));
  }, [tokenIds]);

  const { data: urisData, isSuccess: urisSuccess } = useReadContracts({
    contracts: uriContracts,
    query: {
      enabled: uriContracts.length > 0,
    },
  });

  const uris = useMemo(() => {
    if (!urisSuccess || !urisData) return [];
    return urisData.map((result) => result.result as string);
  }, [urisData, urisSuccess]);

  // 从 URI 中提取图片过于麻烦。这里直接 URI 映射
  const imgList = uris.map((uri) => uri + ".png");
  // TODO getRarity
  function NftCard() {
    const listItems = tokenIds.map((tokenId, index) => (
      <div key={tokenId} className="card bg-base-100 shadow-sm">
        <figure className="px-4 pt-4">
          <div className="mask mask-circle w-24">
            <img src={imgList[index] || "#"} alt={`NFT ${tokenId}`} />
          </div>
        </figure>
        <div className="card-body items-center text-center p-4">
          <p className="text-sm">Token ID: {tokenId.toString()}</p>
        </div>
      </div>
    ));
    return <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">{listItems}</div>;
  }

  return (
    <div className="container min-h-80 py-2 px-8">
      <h2 className="text-2xl font-bold mb-4">我的NFT</h2>
      <div>
        卡池 id：<span className="badge badge-soft badge-accent">{poolConfig?.poolId}</span>
      </div>
      <div>
        共计：<span className="badge badge-soft badge-success">{tokenIds.length}</span>
      </div>
      <div className="divider"></div>
      <NftCard />
    </div>
  );
}
