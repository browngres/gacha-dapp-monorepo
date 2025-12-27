import { useEffect } from "react";
import { useQuery } from "wagmi/query";

export function GachaStepTwo({ pool, reqId, currStep, setCurrStep, txHash }) {
  console.log("render GachaStepTwo");

  function Signature() {
    // 获取签名的组件
    async function fetchSignature(): Promise<string> {
      try {
        console.log("发出了一次请求");
        const response = await fetch("/api/gacha/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pool: Number(pool), txHash: txHash }),
        });

        if (response.ok) {
          // 存入 cookie
          const _signature = (await response.json()).data.signature;
          setSignatureCookie(_signature);
          return _signature;
        }
        if (response.status == 400) {
          return Promise.reject(new Error("Fetch Failed: " + (await response.text())));
        }
      } catch (error) {
        console.error(error);
        return Promise.reject(new Error("Fetch Failed"));
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

    // 请求签名的 Query
    const {
      data: signature,
      isSuccess,
      isError,
      error,
      isFetching,
    } = useQuery({ queryKey: ["signature", pool, reqId, txHash], queryFn: fetchSignature, staleTime: 2 * 60 * 1000 });

    // 更新为下一步骤
    useEffect(() => {
      if (isSuccess && currStep == 2) setCurrStep(3); // 防止 step 抖动
    }, [isSuccess]);

    return (
      <>
        签名：
        {isFetching ? (
          <span className="loading loading-spinner loading-md text-secondary"></span>
        ) : isError ? (
          <span>Error: {error.message}</span>
        ) : (
          <span className="wrap-anywhere text-[12px]">{signature as string}</span>
        )}
      </>
    );
  }

  return (
    <li>
      <p>等待后端返回签名</p>
      {currStep >= 2 && <Signature />}
    </li>
  );
}
