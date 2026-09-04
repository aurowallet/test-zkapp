import { useMinaProvider } from "@/context/MinaProviderContext";
import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { getErrorMessage, hasErrorCode } from "@/utils";
import { assertMesaTransactionShape } from "@/utils/zkMesaUtils";
import ZkappMesaWorkerClient from "@/utils/zkappMesaWorkerClient";
import {
  ChainInfoArgs,
  ProviderError,
  SendTransactionResult,
  SendZkTransactionResult,
  SignedZkappCommand,
} from "@aurowallet/mina-provider";
import { Field, PrivateKey, PublicKey } from "o1js";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";
import Switch from "../Switch";

const StyledButtonGroup = styled.div`
  display: flex;
  > :not(:first-child) { margin-left: 20px; }
`;
const StyledSwitchRow = styled.div`
  height: 25px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;
const StyledLeftName = styled.div`
  font-size: 14px;
  font-weight: 400;
  margin-right: 10px;
`;
const StyledRoute = styled.div`
  font-size: 16px;
  color: #6b5dfb;
  font-weight: 400;
  padding: 2px 4px;
  cursor: pointer;
`;

export const MesaSignTransactionBox = ({ currentAccount, network }: { currentAccount: string; network: ChainInfoArgs }) => {
  const { provider } = useMinaProvider();
  const [gqlUrl, setGqlUrl] = useState("");
  const [zkAddress, setZkAddress] = useState("");
  const [fee, setFee] = useState("");
  const [memo, setMemo] = useState("");
  const [nonce, setNonce] = useState("");
  const [updateBtnStatus, setUpdateBtnStatus] = useState(true);
  const [initBtnStatus, setInitBtnStatus] = useState(false);
  const [zkAppStatus, setZkAppStatus] = useState("");
  const [createBtnStatus, setCreateBtnStatus] = useState(true);
  const [keys, setKeys] = useState({ publicKey: "", privateKey: "", status: "" });
  const [displayText, setDisplayText] = useState("");
  const [txHash, setTxHash] = useState("");
  const [createHash, setCreateHash] = useState("");
  const [createText, setCreateText] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [nextSendTxBody, setNextSendTxBody] = useState<string>();
  const [sendTxStatus, setSendTxStatus] = useState(true);
  const [state, setState] = useState({
    workerClient: null as null | ZkappMesaWorkerClient,
    hasBeenSetup: false,
    currentNum: null as null | Field,
    publicKey: null as null | PublicKey,
    zkappPublicKey: null as null | PublicKey,
  });

  const initialize = useCallback(async () => {
    if (!zkAddress) throw new Error("Please input contract first!");
    if (!gqlUrl.trim()) throw new Error("Please input GraphQL URL first!");
    if (!network.networkID) throw new Error("Please connect to a network first!");
    if (!provider) throw new Error("Auro Wallet not detected");

    if (state.hasBeenSetup) return state.workerClient!;

    setDisplayText("Loading Mesa web worker...");
    const workerClient = new ZkappMesaWorkerClient();
    try {
      await workerClient.setActiveInstanceToMesa(gqlUrl, network.networkID);
      const accounts = await provider.requestAccounts();
      if (!Array.isArray(accounts) || accounts.length === 0) {
        throw new Error(getErrorMessage(accounts, "Please connect wallet first"));
      }
      const publicKey = PublicKey.fromBase58(accounts[0]);
      await workerClient.fetchAccount({ publicKey });
      await workerClient.loadContract();
      setDisplayText("Compiling Mesa zkApp...");
      await workerClient.compileContract();
      const zkappPublicKey = PublicKey.fromBase58(zkAddress);
      await workerClient.initZkappInstance(zkappPublicKey);
      await workerClient.fetchAccount({ publicKey: zkappPublicKey });
      const currentNum = await workerClient.getNum();
      setState({
        workerClient,
        hasBeenSetup: true,
        publicKey,
        zkappPublicKey,
        currentNum,
      });
      setUpdateBtnStatus(false);
      setInitBtnStatus(true);
      setDisplayText("");
      return workerClient;
    } catch (error) {
      workerClient.terminate();
      throw error;
    }
  }, [currentAccount, gqlUrl, network.networkID, provider, state, zkAddress]);

  const requestWalletTransaction = useCallback(async (transaction: unknown, onlySign = false) => {
    if (!provider) throw new Error("Auro Wallet not detected");
    const args: any = {
      transaction: transaction as object,
      feePayer: { fee: fee ? Number(fee) : undefined, memo },
    };
    if (onlySign) args.onlySign = true;
    if (nonce.trim()) args.nonce = Number(nonce);
    const result: SendTransactionResult | ProviderError = await provider.sendTransaction(args).catch((error) => error);
    if (hasErrorCode(result)) throw new Error(getErrorMessage(result, "Failed to send transaction"));
    return result as SendZkTransactionResult;
  }, [fee, memo, nonce, provider]);

  const onClickUpdate = useCallback(async () => {
    if (!state.hasBeenSetup || !state.workerClient || !state.publicKey) {
      throw new Error("Please input contract address and initialize contract first");
    }
    setTxHash("");
    setDisplayText("Creating a Mesa transaction...");
    await state.workerClient.fetchAccount({ publicKey: state.publicKey });
    await state.workerClient.createUpdateTransaction();
    setDisplayText("Creating Mesa proof...");
    await state.workerClient.proveUpdateTransaction();
    const transaction = await state.workerClient.getTransactionJSON();
    assertMesaTransactionShape(transaction);
    setTxHash(JSON.stringify(await requestWalletTransaction(transaction)));
    setDisplayText("");
  }, [requestWalletTransaction, state]);

  const onRefreshCurrentNum = useCallback(async () => {
    if (!state.workerClient || !state.zkappPublicKey) throw new Error("Initialize Mesa zkApp first");
    setZkAppStatus(": Getting zkApp state...");
    await state.workerClient.fetchAccount({ publicKey: state.zkappPublicKey });
    const currentNum = await state.workerClient.getNum();
    setState((current) => ({ ...current, currentNum }));
    setZkAppStatus("");
  }, [state]);

  useEffect(() => {
    setInitBtnStatus(false);
    setUpdateBtnStatus(true);
    setSendTxStatus(true);
    setNextSendTxBody(undefined);
    setState((current) => ({
      ...current,
      hasBeenSetup: false,
      workerClient: null,
      currentNum: null,
    }));
  }, [currentAccount, gqlUrl, network.networkID, zkAddress]);

  useEffect(() => {
    return () => state.workerClient?.terminate();
  }, [state.workerClient]);

  const createContract = useCallback(async (privateKey: PrivateKey, address: PublicKey) => {
    if (!currentAccount) throw new Error("Need connect wallet first");
    if (!gqlUrl.trim()) throw new Error("Please input GraphQL URL first!");
    if (!network.networkID) throw new Error("Please connect to a network first!");
    setCreateHash("");
    setCreateText("Loading Mesa web worker...");
    const workerClient = new ZkappMesaWorkerClient();
    try {
      await workerClient.setActiveInstanceToMesa(gqlUrl, network.networkID);
      await workerClient.fetchAccount({ publicKey: PublicKey.fromBase58(currentAccount) });
      await workerClient.loadContract();
      setCreateText("Compiling Mesa zkApp...");
      await workerClient.compileContract();
      await workerClient.initZkappInstance(address);
      await workerClient.createDeployTransaction(privateKey, currentAccount);
      await workerClient.proveUpdateTransaction();
      const transaction = await workerClient.getTransactionJSON();
      assertMesaTransactionShape(transaction);
      setCreateText("waiting wallet confirm");
      setCreateHash(JSON.stringify(await requestWalletTransaction(transaction)));
      setCreateText("");
    } finally {
      workerClient.terminate();
    }
  }, [currentAccount, gqlUrl, network.networkID, requestWalletTransaction]);

  useEffect(() => {
    setCreateBtnStatus(!(gqlUrl.length > 0 && keys.publicKey));
  }, [gqlUrl, keys]);

  const onClickCreateKey = useCallback(() => {
    const privateKey = PrivateKey.random();
    setKeys({
      publicKey: privateKey.toPublicKey().toBase58(),
      privateKey: privateKey.toBase58(),
      status: String(self.crossOriginIsolated),
    });
  }, []);

  const onClickCreate = useCallback(async () => {
    await createContract(PrivateKey.fromBase58(keys.privateKey), PublicKey.fromBase58(keys.publicKey));
  }, [createContract, keys]);

  const onClickBuildTx = useCallback(async () => {
    setTxHash("");
    setNextSendTxBody(undefined);
    setSendTxStatus(true);
    setDisplayText("Creating a Mesa transaction...");
    if (!state.hasBeenSetup || !state.workerClient || !state.publicKey) {
      setDisplayText("Failed: Please input contract address and initialize contract first");
      return;
    }
    try {
      await state.workerClient.fetchAccount({ publicKey: state.publicKey });
      setDisplayText("Creating Mesa transaction body...");
      await state.workerClient.createManualUpdateTransaction(Math.floor(Math.random() * 1001), zkAddress);
      setDisplayText("Requesting wallet signature...");
      const transaction = await state.workerClient.getTransactionJSON();
      assertMesaTransactionShape(transaction);
      const result = await requestWalletTransaction(transaction, true);
      if (!("signedData" in result)) throw new Error("Wallet did not return signedData for Mesa signing");
      const signedData = (result as SignedZkappCommand).signedData;
      setTxHash(signedData);
      setNextSendTxBody(signedData);
      setSendTxStatus(false);
      setDisplayText("");
    } catch (error) {
      setTxHash("");
      setDisplayText("Failed to build and sign transaction: " + getErrorMessage(error));
    }
  }, [requestWalletTransaction, state, zkAddress]);

  const onClickTxSend = useCallback(async () => {
    setTxHash("");
    setDisplayText("Preparing Mesa transaction proof...");
    if (!state.workerClient || !nextSendTxBody) {
      setDisplayText("Failed to send transaction: Build and sign a Mesa transaction first");
      return;
    }
    try {
      setDisplayText("Proving Mesa transaction...");
      const hash = await state.workerClient.sendProving(nextSendTxBody);
      setTxHash(String(hash));
      setDisplayText("");
    } catch (error) {
      setTxHash("");
      setDisplayText("Failed to send transaction: " + getErrorMessage(error));
    }
  }, [nextSendTxBody, state.workerClient]);

  const keysContent = useMemo(() => keys.privateKey ? JSON.stringify(keys, null, 2) : "", [keys]);

  return (
    <Box>
      <StyledBoxTitle>
        Mesa zkApp Signing
        <StyledRoute><Link href="/wallet-connect">Android/iOS Wallet Connect</Link></StyledRoute>
      </StyledBoxTitle>
      * need input url and generate Key first
      <Input placeholder="Input Graphql Url" onChange={(event) => setGqlUrl(event.target.value)} />
      <StyledDividedLine />
      <Button onClick={onClickCreateKey}>Generate Zk-Contract-Key</Button>
      <InfoRow title="zkApp keys" type={InfoType.secondary}>{keysContent && <div>{keysContent}</div>}</InfoRow>
      <Button disabled={createBtnStatus} onClick={onClickCreate}>Create Zk-Contract</Button>
      <InfoRow title="zkApp Create Result: " content={createHash || createText} type={InfoType.secondary} />
      <StyledDividedLine />
      <Input placeholder="Set ZkApp Address" onChange={(event) => setZkAddress(event.target.value)} />
      <StyledSwitchRow>
        <StyledLeftName>sign in wallet, broadcast in zkApp</StyledLeftName>
        <Switch isChecked={isChecked} toggleSwitch={(event) => setIsChecked(event.target.checked)} />
      </StyledSwitchRow>
      <Button disabled={initBtnStatus} checkConnection={true} onClick={async () => { await initialize(); }}>Init ZkState</Button>
      <Input placeholder="Set Fee (Option)" onChange={(event) => setFee(event.target.value)} />
      <Input placeholder="Set memo (Option)" onChange={(event) => setMemo(event.target.value)} />
      <Input placeholder="Set Nonce (Option)" onChange={(event) => setNonce(event.target.value)} />
      {isChecked ? (
        <StyledButtonGroup>
          <Button checkConnection={true} disabled={updateBtnStatus} onClick={onClickBuildTx}>Build TxBody And Sign</Button>
          <Button checkConnection={true} disabled={sendTxStatus} onClick={onClickTxSend}>Send Tx</Button>
        </StyledButtonGroup>
      ) : (
        <Button checkConnection={true} disabled={updateBtnStatus} onClick={onClickUpdate}>Update</Button>
      )}
      <InfoRow title="Update Result: " content={txHash || displayText} type={InfoType.secondary} />
      <StyledDividedLine />
      <StyledButtonGroup>
        <Button disabled={updateBtnStatus} onClick={onRefreshCurrentNum}>Get zkApp State</Button>
        <InfoRow title="zkApp State: " content={zkAppStatus || state.currentNum + ""} type={InfoType.secondary} />
      </StyledButtonGroup>
    </Box>
  );
};
