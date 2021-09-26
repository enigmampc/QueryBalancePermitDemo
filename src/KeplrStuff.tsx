import { Button } from "@material-ui/core";
import { FileCopyOutlined } from "@material-ui/icons";
import React, { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { BroadcastMode, SigningCosmWasmClient } from "secretjs";
import { SecretAddress } from "./App";

export function KeplrPanel({
  secretjs,
  setSecretjs,
  myAddress,
  setMyAddress,
  setOutput,
}: {
  secretjs: SigningCosmWasmClient | null;
  setSecretjs: React.Dispatch<React.SetStateAction<SigningCosmWasmClient | null>>;
  myAddress: SecretAddress | null;
  setMyAddress: React.Dispatch<React.SetStateAction<SecretAddress | null>>;
  setOutput: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const content = (
    <div style={{ display: "flex", alignItems: "center", borderRadius: 10 }}>
      <img src="/keplr.svg" style={{ width: "1.8rem", borderRadius: 10 }} />
      <span style={{ margin: "0 0.3rem" }}>{secretjs ? myAddress : "Connect wallet & Query balance"}</span>
    </div>
  );

  if (secretjs) {
    return (
      <CopyToClipboard
        text={myAddress as SecretAddress}
        onCopy={() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 3000);
        }}
      >
        <Button variant="contained" style={{ background: "white", textTransform: "none" }}>
          {content} <FileCopyOutlined fontSize="small" style={isCopied ? { fill: "green" } : undefined} />
        </Button>
      </CopyToClipboard>
    );
  } else {
    return (
      <Button
        variant="contained"
        style={{ background: "white" }}
        onClick={() => setupKeplr(setSecretjs, setMyAddress, setOutput)}
      >
        {content}
      </Button>
    );
  }
}

export const chainId = "enigma-pub-testnet-3";

async function setupKeplr(
  setSecretjs: React.Dispatch<React.SetStateAction<SigningCosmWasmClient | null>>,
  setMyAddress: React.Dispatch<React.SetStateAction<SecretAddress | null>>,
  setOutput: React.Dispatch<React.SetStateAction<string | null>>
) {
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  while (!window.keplr || !window.getEnigmaUtils || !window.getOfflineSigner) {
    await sleep(50);
  }

  await window.keplr.experimentalSuggestChain({
    chainId: chainId,
    chainName: "secret-dev-env",
    rpc: "http://localhost:26657",
    rest: "http://localhost:1337",
    bip44: {
      coinType: 529,
    },
    coinType: 529,
    stakeCurrency: {
      coinDenom: "SCRT",
      coinMinimalDenom: "uscrt",
      coinDecimals: 6,
    },
    bech32Config: {
      bech32PrefixAccAddr: "secret",
      bech32PrefixAccPub: "secretpub",
      bech32PrefixValAddr: "secretvaloper",
      bech32PrefixValPub: "secretvaloperpub",
      bech32PrefixConsAddr: "secretvalcons",
      bech32PrefixConsPub: "secretvalconspub",
    },
    currencies: [
      {
        coinDenom: "SCRT",
        coinMinimalDenom: "uscrt",
        coinDecimals: 6,
      },
    ],
    feeCurrencies: [
      {
        coinDenom: "SCRT",
        coinMinimalDenom: "uscrt",
        coinDecimals: 6,
      },
    ],
    gasPriceStep: {
      low: 0.1,
      average: 0.25,
      high: 0.4,
    },
    features: ["secretwasm"],
  });
  await window.keplr.enable(chainId);

  const keplrOfflineSigner = window.getOfflineSigner(chainId);
  const accounts = await keplrOfflineSigner.getAccounts();

  const myAddress = accounts[0].address;

  const secretjs = new SigningCosmWasmClient(
    "http://localhost:1337",
    myAddress,
    //@ts-ignore
    keplrOfflineSigner,
    window.getEnigmaUtils(chainId),
    null,
    BroadcastMode.Sync
  );

  const permit = await window.keplr.signAmino(chainId, myAddress, {
    chain_id: chainId,
    account_number: "0",
    sequence: "0",
    fee: {
      amount: [{ denom: "uscrt", amount: "0" }],
      gas: "1",
    },
    msgs: [
      {
        type: "query_balance_permit",
        value: {
          permit_user_id: "secretswap.io",
          query_balance_of: myAddress,
          message: "This signature is a permit to query my balance.",
        },
      },
    ],
    memo: "",
  });

  setOutput("Loading balance with permit...");

  const result = await secretjs.queryContractSmart("secret18vd8fpwxzck93qlwghaj6arh4p7c5n8978vsyg", {
    balance_with_permit: permit,
  });

  setOutput(JSON.stringify(result, null, 4));
  setMyAddress(myAddress as SecretAddress);
  setSecretjs(secretjs);
}
