import { APITester } from "./components/APITester";
import "./styles/index.css";

import logo from "./public/logo.svg";
import reactLogo from "./public/react.svg";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SendTransaction } from "./components/send-tx";

import { GachaTab } from "./components/gachaTab";

export function App() {
  return (
    <div className="min-h-[800px]">
      <div className="navbar bg-base-100 shadow-sm min-w-5xl">
        <div className="navbar-start">
          <h1 className="btn btn-ghost text-xl font-bold my-2 leading-tight">Bun + React + daisyUI</h1>
        </div>
        <div className="navbar-center">
          <div className="flex justify-center items-center gap-1 ">
            <img
              src={logo}
              alt="Bun Logo"
              className="h-20 p-3 transition-all duration-300 hover:drop-shadow-[0_0_2em_#646cffaa] scale-80"
            />
            <img
              src={reactLogo}
              alt="React Logo"
              className="h-20 p-3 transition-all duration-300 hover:drop-shadow-[0_0_2em_#61dafbaa] animate-[spin_20s_linear_infinite] scale-80"
            />
            <img
              src={"https://img.daisyui.com/images/daisyui/daisyui-logo-128.png"}
              alt="daisyUI Logo"
              className="h-20 p-3 transition-all duration-300 hover:drop-shadow-[0_0_2em_goldenrod] scale-80"
            />
          </div>
        </div>
        <div className="navbar-end">
          <label className="flex cursor-pointer gap-2 pr-4">
            <span className="label-text">dark</span>
            <input type="checkbox" value="dark" className="toggle theme-controller" />
          </label>
          <ConnectButton />
        </div>
      </div>

      <div className="container-sm mx-auto py-8 text-center relative z-10">
        <div className="tabs tabs-box min-w-3xl">
          <input type="radio" name="my_tabs_1" className="tab" aria-label="Gacha" defaultChecked />
          <div className="tab-content bg-base-100 border-base-300 p-6">
            <GachaTab />
          </div>

          <input type="radio" name="my_tabs_1" className="tab" aria-label="Claim" />
          <div className="tab-content bg-base-100 border-base-300 p-6"></div>

          <input type="radio" name="my_tabs_1" className="tab" aria-label="Mine" />
          <div className="tab-content bg-base-100 border-base-300 p-6"></div>

          <input type="radio" name="my_tabs_1" className="tab" aria-label="Admin" />
          <div className="tab-content bg-base-100 border-base-300 p-6">
            <SendTransaction />
          </div>
          <input type="radio" name="my_tabs_1" className="tab" aria-label="APITester" />
          <div className="tab-content bg-base-100 border-base-300 p-6">
            <APITester />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
