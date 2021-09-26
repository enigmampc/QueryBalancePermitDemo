import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./index.css";

import { SigningCosmWasmClient } from "secretjs";
import { StdFee } from "secretjs/types/types";
import { Window as KeplrWindow } from "@keplr-wallet/types";
import { KeplrPanel } from "./KeplrStuff";
declare global {
  interface Window extends KeplrWindow {}
}

export type SecretAddress = `secret1${string}`;

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

export default function App() {
  const [myAddress, setMyAddress] = useState<SecretAddress | null>(null);
  const [secretjs, setSecretjs] = useState<SigningCosmWasmClient | null>(null);
  const [output, setOutput] = useState<string | null>("");

  return (
    <div style={{ padding: "0.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "3rem",
        }}
      >
        <div>
          <KeplrPanel
            secretjs={secretjs}
            setSecretjs={setSecretjs}
            myAddress={myAddress}
            setMyAddress={setMyAddress}
            setOutput={setOutput}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <pre>{output}</pre>
      </div>
    </div>
  );
}
