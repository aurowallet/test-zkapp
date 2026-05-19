import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { getErrorMessage, hasErrorCode, timeout } from "@/utils";
import ZkappWorkerClient from "@/utils/zkappWorkerClient";
import {
  ChainInfoArgs,
  ProviderError,
  SendTransactionResult,
  SendZkTransactionResult,
  SignedZkappCommand,
} from "@aurowallet/mina-provider";
import { Field, PrivateKey, PublicKey } from "o1js";
import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";
import Switch from "../Switch";
import Link from "next/link";
import { useMinaProvider } from "@/context/MinaProviderContext";
import toast from "react-hot-toast";

const StyledButtonGroup = styled.div`
  display: flex;
  > :not(:first-child) {
    margin-left: 20px;
  }
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
export const SignTransactionBox = ({
  currentAccount,
  network,
}: {
  currentAccount: string;
  network: ChainInfoArgs;
}) => {
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
  const [keys, setKeys] = useState({
    publicKey: "",
    privateKey: "",
    status: "",
  });

  const [displayText, setDisplayText] = useState("");
  const [txHash, setTxHash] = useState("");
  const [createHash, setCreateHash] = useState("");

  const [createText, setCreateText] = useState("");
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [depolyLocalStatus, setDepolyLocalStatus] = useState<boolean>(false);
  const [nextSendTxBody, setNextSendTxBody] = useState<string>();
  const [sendTxStatus, setSendTxStatus] = useState(true);

  const toggleSwitch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsChecked(event.target.checked);
      setDepolyLocalStatus(false);
    },
    []
  );

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

  const onChangeGqlUrl = useCallback((e: any) => {
    setGqlUrl(e.target.value);
  }, []);

  const onChangeZkAddress = useCallback((e: any) => {
    setZkAddress(e.target.value);
  }, []);
  const onChangeFee = useCallback((e: any) => {
    setFee(e.target.value);
  }, []);
  const onChangeMemo = useCallback((e: any) => {
    setMemo(e.target.value);
  }, []);
  const onChangeNonce = useCallback((e: any) => {
    setNonce(e.target.value);
  }, []);
  function randomIntFromInterval(max: number) {
    return Math.floor(Math.random() * (max + 1));
  }
  const onClickTest = useCallback(async () => {
    const zkappWorkerClient = new ZkappWorkerClient();
    await timeout(5);
    const nextStep = randomIntFromInterval(1);
    if (nextStep) {
      // sign and send in local
      const signRes = await zkappWorkerClient.signAndSendTx(
        "",
        "",
        gqlUrl,
        network.networkID
      );
    } else {
      // sign in ext and send in local
      const signRes = await zkappWorkerClient.buildTxBody(
        "",
        "",
        gqlUrl,
        network.networkID
      );
      const sendRes = await zkappWorkerClient.onlyProving(
        signRes as string,
        gqlUrl,
        network.networkID
      );
    }
  }, [gqlUrl, network]);
  const onClickInit = useCallback(
    async (forceInit?: boolean) => {
      if (!zkAddress) {
        alert("Please input contract first!");
        return;
      }

      if (!state.hasBeenSetup || forceInit) {
        setDisplayText("Loading web worker...");
        const zkappWorkerClient = new ZkappWorkerClient();
        await timeout(5);

        setDisplayText("Done loading web worker");
        await zkappWorkerClient.setActiveInstanceToBerkeley(
          gqlUrl,
          network.networkID
        );

        const mina = provider;

        if (mina == null) {
          setState({ ...state, hasWallet: false });
          return;
        }
        const connectAccount = await mina.requestAccounts();
        if (!Array.isArray(connectAccount)) {
          toast.error(getErrorMessage(connectAccount, "Please connect wallet first"));
          return;
        }
        const publicKeyBase58: string = connectAccount[0];
        const publicKey = PublicKey.fromBase58(publicKeyBase58);

        setDisplayText(`Using key:${publicKey.toBase58()}`);

        setDisplayText("Checking if fee payer account exists...");

        const res = await zkappWorkerClient.fetchAccount({
          publicKey: publicKey!,
        });
        const accountExists = res.error == null;

        await zkappWorkerClient.loadContract();

        setDisplayText("Compiling zkApp...");
        await zkappWorkerClient.compileContract();
        setDisplayText("zkApp compiled...");
        const zkappPublicKey = PublicKey.fromBase58(zkAddress);
        await zkappWorkerClient.initZkappInstance(zkappPublicKey);

        setDisplayText("Getting zkApp state...");
        await zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey });
        const currentNum = await zkappWorkerClient.getNum();
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
    },
    [zkAddress, state, gqlUrl, isChecked, network, provider]
  );

  const onClickUpdate = useCallback(async () => {
    if (!state.hasBeenSetup) {
      alert("Please input contract address And init contract!");
      return;
    }
    setTxHash("");
    setDisplayText("");

    setState({ ...state, creatingTransaction: true });

    setDisplayText("Creating a transaction...");

    await state.zkappWorkerClient!.fetchAccount({
      publicKey: state.publicKey!,
    });

    await state.zkappWorkerClient!.createUpdateTransaction();

    setDisplayText("Creating proof...");
    await state.zkappWorkerClient!.proveUpdateTransaction();

    setDisplayText("Requesting send transaction...");
    const transactionJSON = await state.zkappWorkerClient!.getTransactionJSON();

    setDisplayText("Getting transaction JSON...");
    if (!provider) {
      setTxHash("");
      setDisplayText("Auro Wallet not detected");
      setState({ ...state, creatingTransaction: false });
      return;
    }
    const res: SendTransactionResult | ProviderError = await provider
      .sendTransaction({
        transaction: transactionJSON as object,
        nonce: parseInt(nonce),
        feePayer: {
          fee: parseFloat(fee),
          memo: memo,
        },
      })
      .catch((err) => err);
    if (hasErrorCode(res)) {
      setTxHash("");
      setDisplayText(getErrorMessage(res, "Failed to send transaction"));
    } else {
      const sendTxResult = res as SendZkTransactionResult;
      setTxHash(JSON.stringify(sendTxResult));
      setDisplayText("");
    }
    setState({ ...state, creatingTransaction: false });
  }, [fee, memo, nonce, state, isChecked, provider]);

  const onRefreshCurrentNum = useCallback(async () => {
    setZkAppStatus(": Getting zkApp state...");

    await state.zkappWorkerClient!.fetchAccount({
      publicKey: state.zkappPublicKey!,
    });
    const currentNum = await state.zkappWorkerClient!.getNum();
    setState({ ...state, currentNum });
    setZkAppStatus("");
  }, [state]);

  useEffect(() => {
    setInitBtnStatus(false);
    setUpdateBtnStatus(true);
  }, [zkAddress]);

  const createContract = useCallback(
    async (depolyPrivateKey: PrivateKey, zkAddress: PublicKey) => {
      setCreateHash("");
      setCreateText("start init");
      const zkappWorkerClient = new ZkappWorkerClient();
      await timeout(5);
      setCreateText("Done loading web worker");
      await zkappWorkerClient.setActiveInstanceToBerkeley(
        gqlUrl,
        network.networkID
      );
      const mina = provider;
      if (mina == null) {
        return;
      }
      const publicKeyBase58: string = currentAccount;
      const publicKey = PublicKey.fromBase58(publicKeyBase58);
      setCreateText(`Using key:${publicKey.toBase58()}`);
      setCreateText("Checking if fee payer account exists...");
      const res = await zkappWorkerClient.fetchAccount({
        publicKey: publicKey!,
      });
      await zkappWorkerClient.loadContract();
      setCreateText("Compiling zkApp...");
      await zkappWorkerClient.compileContract();
      setCreateText("zkApp compiled");
      await zkappWorkerClient.initZkappInstance(zkAddress);
      await zkappWorkerClient.createDeployTransaction(
        depolyPrivateKey,
        currentAccount
      );
      await zkappWorkerClient.proveUpdateTransaction();
      const transactionJSON = await zkappWorkerClient.getTransactionJSON();
      setCreateText("waiting wallet confirm");
      if (!provider) {
        setCreateText("");
        setCreateHash("Auro Wallet not detected");
        return;
      }
      const sendRes: SendTransactionResult | ProviderError = await provider
        .sendTransaction({
          transaction: transactionJSON as object,
          nonce: parseInt(nonce),
          feePayer: {
            memo: "",
          },
        })
        .catch((err) => err);
      setCreateText("");
      if (hasErrorCode(sendRes)) {
        setCreateHash(getErrorMessage(sendRes, "Failed to create contract"));
      } else {
        const sendTxResult = sendRes as SendZkTransactionResult;
        setCreateHash(JSON.stringify(sendTxResult));
        setDisplayText("");
      }
    },
    [gqlUrl, nonce, currentAccount, network, provider]
  );

  useEffect(() => {
    if (gqlUrl.length > 0 && keys.publicKey) {
      setCreateBtnStatus(false);
    } else {
      setCreateBtnStatus(true);
    }
  }, [gqlUrl, keys]);
  const onClickCreateKey = useCallback(async () => {
    let zkAppPrivateKey = PrivateKey.random();
    let zkAppAddress = zkAppPrivateKey.toPublicKey();
    setKeys({
      publicKey: PublicKey.toBase58(zkAppAddress),
      privateKey: PrivateKey.toBase58(zkAppPrivateKey),
      status: String(self.crossOriginIsolated),
    });
  }, []);
  const onClickCreate = useCallback(async () => {
    if (!currentAccount) {
      setCreateText("Need connect wallet first");
      return;
    }
    let zkAppPrivateKey = PrivateKey.fromBase58(keys.privateKey);
    let zkAppAddress = PublicKey.fromBase58(keys.publicKey);
    await createContract(zkAppPrivateKey, zkAppAddress);
  }, [currentAccount, keys, createContract]);

  const onClickBuilTx = useCallback(async () => {
    onClickInit(true);
    await timeout(5);
    if (!state.hasBeenSetup) {
      alert("Please input contract address And init contract!");
      return;
    }
    let onlySign = isChecked;
    setTxHash("");
    setDisplayText("");

    setState({ ...state, creatingTransaction: true });

    setDisplayText("Creating a transaction...");

    await state.zkappWorkerClient!.fetchAccount({
      publicKey: state.publicKey!,
    });

    const num = randomIntFromInterval(1000);
    await state.zkappWorkerClient!.createManulUpdateTransaction(num, zkAddress);

    setDisplayText("Creating proof...");

    setDisplayText("Requesting send transaction...");
    const transactionJSON = await state.zkappWorkerClient!.getTransactionJSON();

    setDisplayText("Getting transaction JSON...");
    const res: SendTransactionResult | ProviderError = await provider
      ?.sendTransaction({
        onlySign: onlySign,
        transaction: transactionJSON as object,
        nonce: parseInt(nonce),
        feePayer: {
          fee: parseFloat(fee),
          memo: memo,
        },
      })
      .catch((err) => err);

    if (hasErrorCode(res)) {
      setTxHash("");
      setDisplayText(getErrorMessage(res, "Failed to build and sign transaction"));
    } else {
      const sendTxResult = res as SendZkTransactionResult;
      const signedData = (sendTxResult as SignedZkappCommand).signedData;
      setTxHash(signedData);
      setNextSendTxBody(signedData);
      setDisplayText("");
      setSendTxStatus(false);
    }
    setState({ ...state, creatingTransaction: false });
  }, [fee, memo, nonce, state, isChecked, zkAddress, onClickInit, provider]);

  const onClickTxSend = useCallback(async () => {
    const sendRes = await state.zkappWorkerClient!.sendProving(
      nextSendTxBody as string
    );
    setTxHash(sendRes as string);
  }, [fee, memo, state, isChecked, txHash, nextSendTxBody]);

  const keysContent = useMemo(() => {
    let content = "";
    if (keys.privateKey) {
      content = JSON.stringify(keys, null, 2);
    }
    return content;
  }, [keys]);
  return (
    <Box>
      <StyledBoxTitle>
        Mina zkApp
        <StyledRoute>
          <Link href={"/wallet-connect"}>Android/iOS Wallect Connect</Link>
        </StyledRoute>
      </StyledBoxTitle>
      * need input url and generate Key first
      <Input placeholder="Input Graphql Url" onChange={onChangeGqlUrl} />
      <StyledDividedLine />
      <Button onClick={onClickCreateKey}>Generate Zk-Contract-Key</Button>
      <InfoRow title={"zkApp keys"} type={InfoType.secondary}>
        {keysContent && <div>{keysContent}</div>}
      </InfoRow>
      <Button disabled={createBtnStatus} onClick={onClickCreate}>
        Create Zk-Contract
      </Button>
      <InfoRow
        title={"zkApp Create Result: "}
        content={createHash || createText}
        type={InfoType.secondary}
      />
      <StyledDividedLine />
      <Input placeholder="Set ZkApp Address" onChange={onChangeZkAddress} />
      <StyledSwitchRow>
        <StyledLeftName>{"sign in wallet, broadcast in zkApp"}</StyledLeftName>
        <Switch isChecked={isChecked} toggleSwitch={toggleSwitch} />
      </StyledSwitchRow>
      {/* <Button disabled={initBtnStatus} onClick={onClickTest}>
        {"testZK"}
      </Button> */}
      <Button
        disabled={initBtnStatus}
        checkConnection={true}
        onClick={() => onClickInit(false)}
      >
        {"Init ZkState"}
      </Button>
      <Input placeholder="Set Fee (Option)" onChange={onChangeFee} />
      <Input placeholder="Set memo (Option)" onChange={onChangeMemo} />
      <Input placeholder="Set Nonce (Option)" onChange={onChangeNonce} />
      {isChecked ? (
        <StyledButtonGroup>
          <Button
            checkConnection={true}
            disabled={updateBtnStatus}
            onClick={onClickBuilTx}
          >
            Build TxBody And Sign
          </Button>
          <Button
            checkConnection={true}
            disabled={sendTxStatus}
            onClick={onClickTxSend}
          >
            Send Tx
          </Button>
        </StyledButtonGroup>
      ) : (
        <Button
          checkConnection={true}
          disabled={updateBtnStatus}
          onClick={onClickUpdate}
        >
          Update
        </Button>
      )}
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
