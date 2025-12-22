import { useConnection } from "wagmi";
import { useQuery } from "wagmi/query";

// 获取签名的组件
function Signature({ pool, reqId, setCurrStep }) {
  console.log("render Signature");
  const connection = useConnection();

  async function fetchSignature(): Promise<string> {
    try {
      console.log("发出了一次请求");
      const response = await fetch("/api/gacha/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pool: Number(pool), address: connection.address, reqId: Number(reqId) }),
      });

      if (response.ok) {
        // 存入 cookie
        console.log(response.status);

        const _signature = (await response.json()).data.signature;
        setSignatureCookie(_signature);
        return _signature;
      }
    } catch (error) {
      console.error(error);
      // alert("Failed to fetch");
    }
    return "";
  }

  // 设置 cookie
  function setSignatureCookie(value: string, days: number = 3): void {
    console.log("得到的签名：", value);

    if (typeof document === "undefined") {
      return;
    }
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = `Gacha_${pool}_${reqId}_signature=${value} ${expires} ; path=/`;
  }

  const {
    data: signature,
    isSuccess,
    isError,
    error,
    isFetching,
  } = useQuery({ queryKey: ["signature", pool, reqId], queryFn: fetchSignature });

  // 更新为下一步骤
  if (isSuccess) setCurrStep(3);

  return (
    <div>
      签名：
      {isFetching ? (
        <span className="loading loading-spinner loading-md  text-secondary"></span>
      ) : isError ? (
        <span>Error: {error.message}</span>
      ) : (
        <div>{signature}</div>
      )}
    </div>
  );
}

export function GachaStepTwo({ pool, reqId, currStep, setCurrStep }) {
  return (
    <li>
      <p>等待后端返回签名</p>
      {currStep >= 2 && reqId != 0 && <Signature pool={pool} reqId={reqId} setCurrStep={setCurrStep} />}
    </li>
  );
}
