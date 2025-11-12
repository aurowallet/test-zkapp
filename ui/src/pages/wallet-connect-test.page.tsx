import { VersionBox } from "@/components/VersionBox";
import { timeout } from "@/utils";
import {
  getCurrentSession,
  initWalletConnect,
  WalletConnectClient,
} from "@/utils/walletConnectFields";
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
  const [isiOSPage, setIsiOSPage] = useState(false);

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
    console.log("is mobile init");
    if (
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) &&
      /Safari/i.test(navigator.userAgent) &&
      !/Chrome/i.test(navigator.userAgent)
    ) {
      console.log("is mobile init 2");
      setIsiOSPage(true);
      const link = document.createElement("a");
      link.href = "https://applinks.aurowallet.com/applinks";
      link.style.display = "none";
      document.body.appendChild(link);
      link.dispatchEvent(new MouseEvent("mouseover"));
      // document.body.removeChild(link);
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

  // Utility function to listen for session_request_sent once
  const listenForRequestSentOnce = useCallback((expectedMethod: string): Promise<void> => {
    console.log('listenForRequestSentOnce called for', expectedMethod);
    if (!client) throw new Error("Client not available");
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        client.off("session_request_sent", handler);
        console.log('listenForRequestSentOnce timeout for', expectedMethod);
        reject(new Error("Request sent timeout (2s)"));
      }, 2000);

      const handler = (event: any) => {
        console.log('listenForRequestSentOnce event for', expectedMethod, event);
        if (event?.request?.method === expectedMethod) {
          console.log('listenForRequestSentOnce method match for', expectedMethod);
          clearTimeout(timeoutId);
          client.off("session_request_sent", handler);
          console.log("session_request_sent confirmed for", expectedMethod, event);  // Commented to reduce noise
          resolve();
        }
      };

      client.on("session_request_sent", handler);
    });
  }, [client]);

  // Handle signing fields (with session_request_sent confirmation)
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

      console.log('handleSignFields - sending request:', paymentRequest);
      // Send request
      const requestPromise = client.request(paymentRequest);
      console.log('handleSignFields - request sent, waiting for confirmation');
      // Listen for session_request_sent to confirm send completion
      await listenForRequestSentOnce("mina_signFields");
      console.log('handleSignFields - request send confirmed');
      // After confirmation, trigger App open
      console.log("Request sent confirmed - opening App");
      openAuroWallet();

      // Continue to wait for response
      const result = await requestPromise;
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
  
  const openAuroWallet = () => {
    const endURL = `https://applinks.aurowallet.com/applinks?action=wc`;
    console.log("Auro Wallet Deep Link:", endURL);
    window.location.href = endURL;
  };

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
      {isiOSPage && <div>iOS page</div>}
      <VersionBox />
      <meta
        name="apple-itunes-app"
        content="app-id=1574034920, app-argument=https://applinks.aurowallet.com/applinks"
      />

      <a
        href="https://applinks.aurowallet.com/applinks"
        style={{
          display: "inline-block",
          padding: "12px 24px",
          backgroundColor: "#007bff",
          color: "white",
          textDecoration: "none",
          borderRadius: "8px",
          fontSize: "16px",
        }}
      >
        Open Auro Wallet
      </a>

      <div style={{ margin: "20px 0" }}>
        <button
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
          }}
          onClick={openAuroWallet}
        >
          Open by click
        </button>
      </div>
      <Toaster />
    </div>
  );
}