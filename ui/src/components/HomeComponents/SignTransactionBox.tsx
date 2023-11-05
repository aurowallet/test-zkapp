import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { timeout } from "@/utils";
import ZkappWorkerClient from "@/utils/zkappWorkerClient";
import { ProviderError, SendTransactionResult } from "@aurowallet/mina-provider";
import { Field, PrivateKey, PublicKey } from "o1js";
import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";

const StyledButtonGroup = styled.div`
  display: flex;
  > :not(:first-child) {
    margin-left: 20px;
  }
`;

export const SignTransactionBox = ({
  currentAccount,
}: {
  currentAccount: string;
}) => {
  const [zkAddress, setZkAddress] = useState("");
  const [fee, setFee] = useState("");
  const [memo, setMemo] = useState("");
  const [updateBtnStatus, setUpdateBtnStatus] = useState(true);
  const [initBtnStatus, setInitBtnStatus] = useState(false);
  const [zkAppStatus, setZkAppStatus] = useState("");
  const [createBtnStatus, setCreateBtnStatus] = useState(true);
  const [keys, setKeys] = useState({
    publicKey: "",
    privateKey: "",
  });

  const [displayText, setDisplayText] = useState("");
  const [txHash, setTxHash] = useState("");
  const [createHash, setCreateHash] = useState("");
  const [gqlUrl,setGqlUrl] = useState("")
  
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


  const onChangeGqlUrl = useCallback((e: any)=>{
    setGqlUrl(e.target.value);
  },[])

  const onChangeZkAddress = useCallback((e: any) => {
    setZkAddress(e.target.value);
  }, []);
  const onChangeFee = useCallback((e: any) => {
    setFee(e.target.value);
  }, []);
  const onChangeMemo = useCallback((e: any) => {
    setMemo(e.target.value);
  }, []);
  const onClickInit = useCallback(async () => {
    if (!zkAddress) {
      alert("Please input contract first!");
      return;
    }

    if (!state.hasBeenSetup) {
      setDisplayText("Loading web worker...");
      console.log("Loading web worker...");
      const zkappWorkerClient = new ZkappWorkerClient();
      await timeout(5);

      setDisplayText("Done loading web worker");
      console.log("Done loading web worker");
      await zkappWorkerClient.setActiveInstanceToBerkeley(gqlUrl);

      const mina = (window as any).mina;

      if (mina == null) {
        setState({ ...state, hasWallet: false });
        return;
      }

      const publicKeyBase58: string = (await mina.requestAccounts())[0];
      const publicKey = PublicKey.fromBase58(publicKeyBase58);

      console.log(`Using key:${publicKey.toBase58()}`);
      setDisplayText(`Using key:${publicKey.toBase58()}`);

      setDisplayText("Checking if fee payer account exists...");
      console.log("Checking if fee payer account exists...");

      const res = await zkappWorkerClient.fetchAccount({
        publicKey: publicKey!,
      });
      const accountExists = res.error == null;

      await zkappWorkerClient.loadContract();

      console.log("Compiling zkApp...");
      setDisplayText("Compiling zkApp...");
      await zkappWorkerClient.compileContract();
      console.log("zkApp compiled");
      setDisplayText("zkApp compiled...");

      const zkappPublicKey = PublicKey.fromBase58(zkAddress);

      await zkappWorkerClient.initZkappInstance(zkappPublicKey);

      console.log("Getting zkApp state...");
      setDisplayText("Getting zkApp state...");
      await zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey });
      const currentNum = await zkappWorkerClient.getNum();
      console.log(`Current state in zkApp: ${currentNum.toString()}`);
      setDisplayText("");

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

      setUpdateBtnStatus(false);
      setInitBtnStatus(true);
    }
  }, [zkAddress, state, gqlUrl]);

  const onClickUpdate = useCallback(async () => {
    if (!state.hasBeenSetup) {
      alert("Please input contract address And init contract!");
      return;
    }
    setTxHash("");
    setDisplayText("");

    setState({ ...state, creatingTransaction: true });

    setDisplayText("Creating a transaction...");
    console.log("Creating a transaction...");

    await state.zkappWorkerClient!.fetchAccount({
      publicKey: state.publicKey!,
    });

    await state.zkappWorkerClient!.createUpdateTransaction();

    setDisplayText("Creating proof...");
    console.log("Creating proof...");
    await state.zkappWorkerClient!.proveUpdateTransaction();

    console.log("Requesting send transaction...");
    setDisplayText("Requesting send transaction...");
    const transactionJSON = await state.zkappWorkerClient!.getTransactionJSON();

    setDisplayText("Getting transaction JSON...");
    console.log("Getting transaction JSON...");
    const res:SendTransactionResult| ProviderError= await (window as any).mina?.sendTransaction({
      transaction: transactionJSON,
      feePayer: {
        fee: fee,
        memo: memo,
      },
    });
    if((res as SendTransactionResult).hash){
      setTxHash((res as SendTransactionResult).hash);
      setDisplayText("");
    }else{
      setTxHash("")
      setDisplayText((res as ProviderError).message);
    }

    setState({ ...state, creatingTransaction: false });
  }, [fee, memo, state]);

  const onRefreshCurrentNum = useCallback(async () => {
    console.log("Getting zkApp state...");
    setZkAppStatus(": Getting zkApp state...");

    await state.zkappWorkerClient!.fetchAccount({
      publicKey: state.zkappPublicKey!,
    });
    const currentNum = await state.zkappWorkerClient!.getNum();
    setState({ ...state, currentNum });
    console.log(`Current state in zkApp: ${currentNum.toString()}`);
    setZkAppStatus("");
  }, [state]);

  useEffect(() => {
    setInitBtnStatus(false);
    setUpdateBtnStatus(true);
  }, [zkAddress]);

  const createContract = useCallback(
    async (depolyPrivateKey: PrivateKey, zkAddress: PublicKey) => {
      const zkappWorkerClient = new ZkappWorkerClient();
      await timeout(5);
      console.log("Done loading web worker");
      await zkappWorkerClient.setActiveInstanceToBerkeley(gqlUrl);
      const mina = (window as any).mina;
      if (mina == null) {
        return;
      }
      const publicKeyBase58: string = currentAccount;
      const publicKey = PublicKey.fromBase58(publicKeyBase58);
      console.log(`Using key:${publicKey.toBase58()}`);
      console.log("Checking if fee payer account exists...");
      const res = await zkappWorkerClient.fetchAccount({
        publicKey: publicKey!,
      });
      await zkappWorkerClient.loadContract();
      console.log("Compiling zkApp...");
      await zkappWorkerClient.compileContract();
      console.log("zkApp compiled");

      await zkappWorkerClient.initZkappInstance(zkAddress);
      await zkappWorkerClient.createDeployTransaction(
        depolyPrivateKey,
        currentAccount
      );
      await zkappWorkerClient.proveUpdateTransaction();
      const transactionJSON = await zkappWorkerClient.getTransactionJSON();
      const sendRes:SendTransactionResult|ProviderError = await (window as any).mina.sendTransaction({
        transaction: transactionJSON,
        feePayer: {
          memo: "",
        },
      });

      if((sendRes as SendTransactionResult).hash){
        setCreateHash((sendRes as SendTransactionResult).hash);
      }else{
        setCreateHash("")
      }
    },
    [gqlUrl, currentAccount]
  );

  useEffect(()=>{
    if(gqlUrl.length>0 && keys.publicKey){
      setCreateBtnStatus(false);
    }else{
      setCreateBtnStatus(true);
    }
  },[gqlUrl,keys])
  const onClickCreateKey = useCallback(async () => {
    let zkAppPrivateKey = PrivateKey.random();
    let zkAppAddress = zkAppPrivateKey.toPublicKey();
    setKeys({
      publicKey: PublicKey.toBase58(zkAppAddress),
      privateKey: PrivateKey.toBase58(zkAppPrivateKey),
    });
  }, []);
  const onClickCreate = useCallback(async () => {
    let zkAppPrivateKey = PrivateKey.fromBase58(keys.privateKey);
    let zkAppAddress = PublicKey.fromBase58(keys.publicKey);
    await createContract(zkAppPrivateKey, zkAppAddress);
  }, [currentAccount, keys]);

  const keysContent = useMemo(()=>{
    let content = ""
    if(keys.privateKey){
      content = JSON.stringify(keys, null, 2)
    }
    return content
  },[keys])
  return (
    <Box>
      <StyledBoxTitle>Mina ZkApp</StyledBoxTitle>
      * need input url and generate Key first
      <Input placeholder="Input Graphql Url" onChange={onChangeGqlUrl} />
      <StyledDividedLine />
      <Button onClick={onClickCreateKey}>Generate Zk-Contract-Key</Button>
      <InfoRow title={"zkApp keys"} type={InfoType.secondary}>
        {keysContent && <div>{keysContent}</div>}
      </InfoRow>
      <Button disabled={createBtnStatus} onClick={onClickCreate}>
        Creat Zk-Contract
      </Button>
      <InfoRow
        title={"zkApp Create Result: "}
        content={createHash}
        type={InfoType.secondary}
      />
      <StyledDividedLine />
      <Input placeholder="Set ZkApp Address" onChange={onChangeZkAddress} />
      <Button disabled={initBtnStatus} onClick={onClickInit}>
        {"Init ZkState"}
      </Button>
      <Input placeholder="Set Fee (Option)" onChange={onChangeFee} />
      <Input placeholder="Set memo (Option)" onChange={onChangeMemo} />
      <Button disabled={updateBtnStatus} onClick={onClickUpdate}>
        Update
      </Button>
      <InfoRow
        title={"Update Result: "}
        content={txHash || displayText}
        type={InfoType.secondary}
      />
      <StyledDividedLine />
      <StyledButtonGroup>
        <Button disabled={updateBtnStatus} onClick={onRefreshCurrentNum}>
          {"Get zkApp State "}
        </Button>
        <InfoRow
          title={"zkApp State: "}
          content={zkAppStatus || state.currentNum + ""}
          type={InfoType.secondary}
        />
      </StyledButtonGroup>
    </Box>
  );
};
