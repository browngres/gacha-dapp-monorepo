import { APITester } from "./components/APITester";
import "./styles/index.css";

import logo from "./public/logo.svg";
import reactLogo from "./public/react.svg";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SendTransaction } from "./components/send-tx";
export function App() {
  return (
    <div className="min-h-[800px]">
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          <a className="btn btn-ghost text-xl">daisyUI</a>
        </div>
        <div className="navbar-center">
          <h1 className="text-2xl font-bold my-2 leading-tight">Bun + React</h1>
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
          </div>
        </div>
        <div className="navbar-end">
          <ConnectButton />
        </div>
      </div>

      <div className="container-sm mx-auto p-8 text-center relative z-10">
        <div className="tabs tabs-box min-w-3xl">
          <input type="radio" name="my_tabs_1" className="tab" aria-label="Gacha" />
          <div className="tab-content bg-base-100 border-base-300 p-6">Tab content 1</div>

          <input type="radio" name="my_tabs_1" className="tab" aria-label="Claim" />
          <div className="tab-content bg-base-100 border-base-300 p-6">Tab content 2</div>

          <input type="radio" name="my_tabs_1" className="tab" aria-label="Admin" defaultChecked />
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
