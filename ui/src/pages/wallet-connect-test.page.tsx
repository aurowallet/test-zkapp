import { timeout } from "@/utils";
import {
  getCurrentSession,
  initWalletConnect,
  WalletConnectClient,
} from "@/utils/walletConnect";
import ZkappWorkerClient from "@/utils/zkappWorkerClient";
import { Field, PublicKey } from "o1js";
import { CSSProperties, useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

// Styles for buttons
const buttonStyle: CSSProperties = {
  margin: "5px",
  padding: "8px 16px",
  borderRadius: "4px",
  border: "none",
  backgroundColor: "#007bff",
  color: "white",
  cursor: "pointer",
  transition: "background-color 0.2s",
  position: "relative",
};

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#cccccc",
  cursor: "not-allowed",
};
// const isMobile =

export default function WalletConnect() {
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<WalletConnectClient | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [paymentResult, setPaymentResult] = useState<string | null>(null);
  const [signedMessage, setSignedMessage] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<string>("mina:mainnet");
  const [loading, setLoading] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [buildZkLog, setBuildZkLog] = useState("");

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);
  const chainOptions = ["mina:mainnet", "mina:devnet", "zeko:testnet"];
  const chromeScheme = isMobile ? "com.android.chrome" : "";

  const [state, setState] = useState({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    hasBeenSetup: false,
    accountExists: false,
    currentNum: null as null | Field,
    publicKey: null as null | PublicKey,
    zkappPublicKey: null as null | PublicKey,
    creatingTransaction: false,
  });

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    if (
      isMobile &&
      /Safari/i.test(navigator.userAgent) &&
      !/Chrome/i.test(navigator.userAgent)
    ) {
      const link = document.createElement("a");
      link.href = "https://applinks.aurowallet.com/applinks";
      link.style.display = "none";
      document.body.appendChild(link);
      link.dispatchEvent(new MouseEvent("mouseover"));
      document.body.removeChild(link);
    }
  }, [isMobile]);

  // Utility to handle loading state
  const withLoading = async (key: string, fn: () => Promise<void>) => {
    setLoading(key);
    try {
      await fn();
    } catch (e) {
      console.error(e);
      setError((e as Error).message || "An error occurred");
    } finally {
      setLoading(null);
    }
  };

  // Update session state dynamically
  const updateSessionState = (currentSession: any) => {
    if (currentSession) {
      setSession(currentSession);
      const minaAccounts = currentSession.namespaces?.mina?.accounts || [];
      if (minaAccounts.length > 0) {
        const minaAddress = minaAccounts[0].split(":")[2];
        setAccount(minaAddress);
        console.log("Connected with account:", minaAddress);
      } else {
        setError("No accounts found in session");
      }
    } else {
      setError("No session established");
    }
  };

  // Handle wallet connection
  const handleConnect = async () => {
    setError(null);
    try {
      const walletClient = await initWalletConnect();
      setClient(walletClient);
      const currentSession = getCurrentSession(walletClient);
      updateSessionState(currentSession);
    } catch (error: any) {
      setError(error.message || "Failed to connect to Auro Wallet");
      console.error("Connection error:", error);
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    if (!client || !session) {
      setError("No active connection to disconnect");
      return;
    }
    try {
      await client.disconnect({
        topic: session.topic,
        reason: { code: 6000, message: "User disconnected" },
      });
      setAccount(null);
      setSession(null);
      setClient(null);
      setError(null);
      setPaymentResult(null);
      setSignedMessage(null);
      console.log("Disconnected from Auro Wallet");
    } catch (error: any) {
      setError(error.message || "Failed to disconnect");
      console.error("Disconnect error:", error);
    }
  };
  const getZkTxBody = useCallback(
    async (config: any, currentAccount: string, forceInit?: boolean) => {
      try {
        let isInited = state.hasBeenSetup;
        let zkappWorkerClient = state.zkappWorkerClient;
        if (!state.hasBeenSetup || forceInit) {
          setBuildZkLog("Loading web worker...");
          zkappWorkerClient = new ZkappWorkerClient();
          await timeout(5);

          setBuildZkLog("Done loading web worker");
          await zkappWorkerClient.setActiveInstanceToBerkeley(
            config.gqlUrl,
            config.networkID
          );
          const publicKeyBase58: string = currentAccount;
          const publicKey = PublicKey.fromBase58(publicKeyBase58);

          setBuildZkLog(`Using key:${publicKey.toBase58()}`);
          setBuildZkLog("Checking if fee payer account exists...");

          const res = await zkappWorkerClient.fetchAccount({
            publicKey: publicKey!,
          });
          const accountExists = res.error == null;

          await zkappWorkerClient.loadContract();

          setBuildZkLog("Compiling zkApp...");
          await zkappWorkerClient.compileContract();
          setBuildZkLog("zkApp compiled");
          const zkappPublicKey = PublicKey.fromBase58(config.zkAddress);
          await zkappWorkerClient.initZkappInstance(zkappPublicKey);

          setBuildZkLog("Getting zkApp state...");
          await zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey });
          const currentNum = await zkappWorkerClient.getNum();
          setBuildZkLog(`Current state in zkApp: ${currentNum.toString()}`);

          setState({
            ...state,
            zkappWorkerClient,
            hasWallet: true,
            hasBeenSetup: true,
            publicKey,
            zkappPublicKey,
            accountExists,
            currentNum,
          });
          isInited = true;
        }
        if (isInited || state.hasBeenSetup) {
          setState({ ...state, creatingTransaction: true });

          setBuildZkLog("Creating a transaction...");

          await zkappWorkerClient!.createUpdateTransaction();

          setBuildZkLog("Creating proof...");
          await zkappWorkerClient!.proveUpdateTransaction();

          setBuildZkLog("Requesting send transaction...");
          const transactionJSON = await zkappWorkerClient!.getTransactionJSON();
          setBuildZkLog(
            "getZkTxBody," + JSON.stringify(transactionJSON).slice(0, 100)
          );
          return transactionJSON;
        }
      } catch (error) {
        setBuildZkLog("build err:" + String(error));
      }
    },
    [state]
  );

  const getZkBuildBody = useCallback(
    async (chainId: string, currentAccount: string) => {
      const testConfig = {
        "mina:devnet": {
          gqlUrl: process.env.NEXT_PUBLIC_DEVNET_GQL,
          networkID: "mina:devnet",
          zkAddress: "B62qqFbciM2QqnwWeXQ8xFLZUYvhhdko1aBWhrneoEzgaVD9xFwNPpJ",
        },
        "mina:mainnet": {
          gqlUrl: process.env.NEXT_PUBLIC_MAINNET_GQL,
          networkID: "mina:mainnet",
          zkAddress: "B62qqFbciM2QqnwWeXQ8xFLZUYvhhdko1aBWhrneoEzgaVD9xFwNPpJ",
        },
        "zeko:testnet": {
          gqlUrl: process.env.NEXT_PUBLIC_ZEKOTESTNET_GQL,
          networkID: "zeko:testnet",
          zkAddress: "B62qkHdJ9R8oJSVMr8JLVQzvi9Mc8cWcFREAa3ewYaBkrPaGMCfu1A5",
        },
      };
      const networkIDs = Object.keys(testConfig);
      if (networkIDs.indexOf(chainId) == -1) {
        toast.custom("not support build zk");
        return;
      }
      const nextConfig = (testConfig as any)[chainId];
      return await getZkTxBody(nextConfig, currentAccount);
    },
    []
  );

  // Handle sending zkApp transaction
  const handleSendZkTransaction = async () => {
    setBuildZkLog("");
    if (!client || !session || !account) {
      setError("Please connect wallet first");
      return;
    }
    const zkTransaction = await getZkBuildBody(selectedChain, account);

    setError(null);
    setPaymentResult(null);
    try {
      const zkRequest = {
        topic: session.topic,
        chainId: selectedChain,
        request: {
          method: "mina_sendTransaction",
          params: {
            scheme: chromeScheme,
            from: account,
            transaction: zkTransaction,
            feePayer: {
              fee: "0.01",
              memo: "test zkApp",
            },
          },
        },
      };
      const result = await client.request(zkRequest);
      onSetResponse(result);
    } catch (error: any) {
      setError(error.message || "Failed to send zk transaction");
      setBuildZkLog("Send zk transaction error:" + JSON.stringify(error));
    }
  };

  // Handle sending stake delegation
  const handleSendDelegation = async () => {
    if (!client || !session || !account) {
      setError("Please connect wallet first");
      return;
    }
    setError(null);
    setPaymentResult(null);
    try {
      const paymentRequest = {
        topic: session.topic,
        chainId: selectedChain,
        request: {
          method: "mina_sendStakeDelegation",
          params: {
            scheme: chromeScheme,
            from: account,
            to: account,
            fee: "0.0013",
            memo: "test delegation v1",
          },
        },
      };
      const result = await client.request(paymentRequest);
      onSetResponse(result);
      console.log("Delegation result:", result);
    } catch (error: any) {
      setError(error.message || "Failed to send delegation");
      console.error("Send delegation error:", error);
    }
  };
  // Handle sending payment
  const handleSendPayment = async () => {
    if (!client || !session || !account) {
      setError("Please connect wallet first");
      return;
    }
    setError(null);
    setPaymentResult(null);
    try {
      const paymentRequest = {
        topic: session.topic,
        chainId: selectedChain,
        request: {
          method: "mina_sendPayment",
          params: {
            scheme: chromeScheme,
            from: account,
            amount: "0.0012",
            to: account,
            fee: "0.002",
            memo: "v1",
          },
        },
      };
      const result = await client.request(paymentRequest);
      onSetResponse(result);
      console.log("Payment result:", result);
    } catch (error: any) {
      setError(error.message || "Failed to send payment");
      console.error("Send payment error:", error);
    }
  };

  // Handle getting wallet info
  const handleWalletInfo = async () => {
    if (!client || !session || !account) {
      setError("Please connect wallet first");
      return;
    }
    setError(null);
    setPaymentResult(null);
    try {
      const paymentRequest = {
        topic: session.topic,
        chainId: selectedChain,
        request: {
          method: "wallet_info",
          params: {}, // Add an empty params object
        },
      };
      const result = await client.request(paymentRequest);
      console.log("getWalletInfo result:", result);
      onSetResponse(result);
      console.log("Wallet info result:", result);
    } catch (error: any) {
      setError(error.message || "Failed to get wallet info");
      console.error("Wallet info error:", error);
    }
  };
  const onSetResponse = (result: any) => {
    try {
      if (typeof result === "string") {
        setPaymentResult(JSON.stringify(JSON.parse(result), null, 2));
      } else {
        setPaymentResult(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      setPaymentResult(JSON.stringify(error, null, 2));
    }
  };

  // Handle signing a message
  const handleSignMessage = async () => {
    if (!client || !session || !account) {
      setError("Please connect wallet first");
      return;
    }
    setError(null);
    setPaymentResult(null);
    try {
      const paymentRequest = {
        topic: session.topic,
        chainId: selectedChain,
        request: {
          method: "mina_signMessage",
          params: {
            scheme: chromeScheme,
            from: account,
            message: "Hello, Mina Protocol! maintnet",
          },
        },
      };
      const result = await client.request(paymentRequest);
      onSetResponse(result);
      console.log("Sign message result:", result);
    } catch (error: any) {
      setError(error.message || "Failed to sign message");
      console.error("Sign message error:", error);
    }
  };

  // Handle verifying a signed message
  const verifySignMessage = async () => {
    if (!client || !session || !account) {
      setError("Please connect wallet first");
      return;
    }
    setError(null);
    try {
      const verifyData = JSON.parse(paymentResult ?? "{}");
      console.log("verifySignMessage, ", verifyData);
      const paymentRequest = {
        topic: session.topic,
        chainId: selectedChain,
        request: {
          method: "mina_verifyMessage",
          params: {
            from: account,
            ...verifyData,
          },
        },
      };
      const result = await client.request(paymentRequest);
      onSetResponse(result);
      console.log("Verify message result:", result);
    } catch (error: any) {
      setError(error.message || "Failed to verify message");
      console.error("Verify message error:", error);
    }
  };

  // Handle signing fields
  const handleSignFields = async () => {
    if (!client || !session || !account) {
      setError("Please connect wallet first");
      return;
    }
    setError(null);
    setPaymentResult(null);
    try {
      const paymentRequest = {
        topic: session.topic,
        chainId: selectedChain,
        request: {
          method: "mina_signFields",
          params: {
            scheme: chromeScheme,
            from: account,
            message: [1, 2, 3],
          },
        },
      };
      const result = await client.request(paymentRequest);
      onSetResponse(result);
      console.log("Sign fields result:", result);
    } catch (error: any) {
      setError(error.message || "Failed to sign fields");
      console.error("Sign fields error:", error);
    }
  };

  // Handle verifying signed fields
  const verifySignFields = async () => {
    if (!client || !session || !account) {
      setError("Please connect wallet first");
      return;
    }
    setError(null);
    try {
      const verifyData = JSON.parse(paymentResult ?? "{}");
      console.log("verifySignFields, ", verifyData);
      const paymentRequest = {
        topic: session.topic,
        chainId: selectedChain,
        request: {
          method: "mina_verifyFields",
          params: {
            from: account,
            ...verifyData,
          },
        },
      };
      const result = await client.request(paymentRequest);
      onSetResponse(result);
      console.log("Verify fields result:", result);
    } catch (error: any) {
      setError(error.message || "Failed to verify fields");
      console.error("Verify fields error:", error);
    }
  };

  // Handle creating a nullifier
  const handleCreateNullifier = async () => {
    if (!client || !session || !account) {
      setError("Please connect wallet first");
      return;
    }
    setError(null);
    setPaymentResult(null);
    try {
      const paymentRequest = {
        topic: session.topic,
        chainId: selectedChain,
        request: {
          method: "mina_createNullifier",
          params: {
            scheme: chromeScheme,
            from: account,
            message: [2, 3, 4],
          },
        },
      };
      const result = await client.request(paymentRequest);
      onSetResponse(result);
      console.log("Create nullifier result:", result);
    } catch (error: any) {
      setError(error.message || "Failed to create nullifier");
      console.error("Create nullifier error:", error);
    }
  };

  // Handle chain selection change
  const handleChainChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChain(event.target.value);
  };

  // Event listeners for WalletConnect updates
  useEffect(() => {
    if (!client) return;

    const handleSessionUpdated = (event: CustomEvent) => {
      const updatedSession = getCurrentSession(client);
      updateSessionState(updatedSession);
    };

    const handleAccountsChanged = (event: CustomEvent) => {
      const newAccounts = event.detail || [];
      if (newAccounts.length > 0) {
        const newAddress = newAccounts[0].split(":")[2];
        setAccount(newAddress);
        console.log("Account changed to:", newAddress);
      } else {
        setAccount(null);
        setError("No accounts available after change");
      }
    };

    const handleChainChanged = (event: CustomEvent) => {
      const newChain = event.detail;
      if (chainOptions.includes(newChain)) {
        setSelectedChain(newChain);
        console.log("Chain changed to:", newChain);
      } else {
        setError(`Unsupported chain: ${newChain}`);
        console.warn("Unsupported chain detected:", newChain);
      }
    };

    const handleSessionDeleted = () => {
      setAccount(null);
      setSession(null);
      setClient(null);
      setError("Session disconnected by wallet");
      setPaymentResult(null);
      setSignedMessage(null);
      console.log("Session deleted");
    };

    window.addEventListener(
      "sessionUpdated",
      handleSessionUpdated as EventListener
    );
    window.addEventListener(
      "accountsChanged",
      handleAccountsChanged as EventListener
    );
    window.addEventListener(
      "chainChanged",
      handleChainChanged as EventListener
    );
    window.addEventListener("sessionDeleted", handleSessionDeleted);

    return () => {
      window.removeEventListener(
        "sessionUpdated",
        handleSessionUpdated as EventListener
      );
      window.removeEventListener(
        "accountsChanged",
        handleAccountsChanged as EventListener
      );
      window.removeEventListener(
        "chainChanged",
        handleChainChanged as EventListener
      );
      window.removeEventListener("sessionDeleted", handleSessionDeleted);
    };
  }, [client]);

  return (
    <div style={{ padding: "20px" }}>
      <div>
        <select
          value={selectedChain}
          onChange={handleChainChange}
          style={{ marginBottom: "15px", padding: "8px", borderRadius: "4px" }}
        >
          {chainOptions.map((chain) => (
            <option key={chain} value={chain}>
              {chain}
            </option>
          ))}
        </select>
      </div>
      {!account ? (
        <button
          style={loading === "connect" ? disabledButtonStyle : buttonStyle}
          onClick={() => withLoading("connect", handleConnect)}
          disabled={loading === "connect"}
        >
          {loading === "connect" ? "Loading..." : "Connect Auro Wallet"}
        </button>
      ) : (
        <div>
          <p>
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
          <div
            style={{
              marginTop: "15px",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <button
              style={
                loading === "walletInfo" ? disabledButtonStyle : buttonStyle
              }
              onClick={() => withLoading("walletInfo", handleWalletInfo)}
              disabled={loading === "walletInfo"}
            >
              {loading === "walletInfo" ? "Loading..." : "Get Wallet Info"}
            </button>
            <button
              style={
                loading === "signMessage" ? disabledButtonStyle : buttonStyle
              }
              onClick={() => withLoading("signMessage", handleSignMessage)}
              disabled={loading === "signMessage"}
            >
              {loading === "signMessage" ? "Loading..." : "Sign Message"}
            </button>
            <button
              style={
                loading === "verifyMessage" ? disabledButtonStyle : buttonStyle
              }
              onClick={() => withLoading("verifyMessage", verifySignMessage)}
              disabled={loading === "verifyMessage"}
            >
              {loading === "verifyMessage" ? "Loading..." : "Verify Message"}
            </button>
            <button
              style={
                loading === "signFields" ? disabledButtonStyle : buttonStyle
              }
              onClick={() => withLoading("signFields", handleSignFields)}
              disabled={loading === "signFields"}
            >
              {loading === "signFields" ? "Loading..." : "Sign Fields"}
            </button>
            <button
              style={
                loading === "verifyFields" ? disabledButtonStyle : buttonStyle
              }
              onClick={() => withLoading("verifyFields", verifySignFields)}
              disabled={loading === "verifyFields"}
            >
              {loading === "verifyFields" ? "Loading..." : "Verify Fields"}
            </button>
            <button
              style={
                loading === "createNullifier"
                  ? disabledButtonStyle
                  : buttonStyle
              }
              onClick={() =>
                withLoading("createNullifier", handleCreateNullifier)
              }
              disabled={loading === "createNullifier"}
            >
              {loading === "createNullifier"
                ? "Loading..."
                : "Create Nullifier"}
            </button>
            <button
              style={
                loading === "sendPayment" ? disabledButtonStyle : buttonStyle
              }
              onClick={() => withLoading("sendPayment", handleSendPayment)}
              disabled={loading === "sendPayment"}
            >
              {loading === "sendPayment" ? "Loading..." : "Send Payment"}
            </button>
            <button
              style={
                loading === "sendDelegation" ? disabledButtonStyle : buttonStyle
              }
              onClick={() =>
                withLoading("sendDelegation", handleSendDelegation)
              }
              disabled={loading === "sendDelegation"}
            >
              {loading === "sendDelegation" ? "Loading..." : "Send Delegation"}
            </button>
            <button
              style={
                loading === "sendZkTransaction"
                  ? disabledButtonStyle
                  : buttonStyle
              }
              onClick={() =>
                withLoading("sendZkTransaction", handleSendZkTransaction)
              }
              disabled={loading === "sendZkTransaction"}
            >
              {loading === "sendZkTransaction"
                ? "Loading..."
                : "Send zkAppTransaction"}
            </button>
            <pre>{buildZkLog}</pre>
            <button
              style={
                loading === "disconnect" ? disabledButtonStyle : buttonStyle
              }
              onClick={() => withLoading("disconnect", handleDisconnect)}
              disabled={loading === "disconnect"}
            >
              {loading === "disconnect" ? "Loading..." : "Disconnect"}
            </button>
          </div>
        </div>
      )}
      {paymentResult && (
        <div
          style={{
            marginTop: "20px",
            maxWidth: "100%",
            width: "90vw",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            height: "500px",
            overflowY: "auto",
          }}
        >
          <h3>Result:</h3>
          <div
            style={{
              background: "#f5f5f5",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            {paymentResult}
          </div>
        </div>
      )}
      {signedMessage && (
        <div style={{ marginTop: "20px" }}>
          <h3>Signed Message:</h3>
          <pre
            style={{
              background: "#f5f5f5",
              padding: "10px",
              borderRadius: "5px",
              maxWidth: "100%",
              width: "100%",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              height: "500px",
              overflowY: "auto",
            }}
          >
            {signedMessage}
          </pre>
        </div>
      )}
      {error && <p style={{ color: "red", marginTop: "15px" }}>{error}</p>}
      <Toaster />
    </div>
  );
}
