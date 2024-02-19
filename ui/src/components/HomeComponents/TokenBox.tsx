import {
  default as ZkappTokenWorkerClient,
  default as ZkappWorkerClient,
} from "@/contracts/basicToken/zkappWorkerClient";
import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { ZkTokenLoopType } from "@/types/zk";
import { getNewAccount, timeout } from "@/utils";
import TxLoopController from "@/utils/txLoopController";
import {
  ProviderError,
  SendTransactionResult,
} from "@aurowallet/mina-provider";
import { PublicKey } from "o1js";
import { useCallback, useMemo, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";

export const TokenBox = ({ currentAccount }: { currentAccount: string }) => {
  const [mintBtnStatus, setMintBtnStatus] = useState(true);
  const [depositBtnStatus, setDepositBtnStatus] = useState(true);
  const [zkappWorkerClient, setZkappWorkerClient] =
    useState<ZkappWorkerClient>();

  const [createTokenTxt, setCreateTokenTxt] = useState("");
  const [mintTokenTxt, setMintTokenTxt] = useState("");
  const [depositTokenTxt, setDepositTokenTxt] = useState("");

  const [receiveAddress, setReceiveAddress] = useState("");
  const [gqlUrl, setGqlUrl] = useState("");
  const [keys, setKeys] = useState({
    publicKey: "",
    privateKey: "",
  });

  const onChangeGqlUrl = useCallback((e: any) => {
    setGqlUrl(e.target.value);
  }, []);

  const onChangeReceiveAddress = useCallback((e: any) => {
    setReceiveAddress(e.target.value);
  }, []);

  const initZkWorker = useCallback(async () => {
    if (zkappWorkerClient) {
      console.log("initZkWorker=0", zkappWorkerClient);
      return zkappWorkerClient;
    }
    // 2. init client
    const workerClient = new ZkappTokenWorkerClient();
    await timeout(5);
    console.log("Done loading web worker");
    setCreateTokenTxt("Done loading web worker");
    await workerClient.setActiveInstanceToBerkeley(gqlUrl);

    // 3. init paye key
    const publicKey = PublicKey.fromBase58(currentAccount);
    console.log(`Using key:${publicKey.toBase58()}`);
    setCreateTokenTxt(`Using key:${publicKey.toBase58()}`);
    console.log("Checking if fee payer account exists...");
    setCreateTokenTxt("Checking if fee payer account exists...");

    const res = await workerClient.fetchAccount({
      publicKey: publicKey!,
    });
    console.log("res...", res);
    await workerClient.loadContract();
    console.log("Compiling zkApp...");
    setCreateTokenTxt("Compiling zkApp...");
    await workerClient.compileContract();
    console.log("compiled");
    setCreateTokenTxt("compiled");
    const data = PublicKey.fromBase58(keys.publicKey);

    // 4. build contract
    await workerClient.initZkappInstance(keys.publicKey);
    console.log("initZkappInstance done");
    setCreateTokenTxt("initZkappInstance done");

    setZkappWorkerClient(workerClient);
    console.log("zkappWorkerClient=0", workerClient);
    return workerClient;
  }, [currentAccount, gqlUrl, keys, zkappWorkerClient]);
  // create token process
  const createTokenContract = useCallback(async () => {
    if (!gqlUrl) {
      alert("Plase input GraphQL URL");
      return;
    }
    if (!keys.privateKey) {
      alert("Plase init account");
      return;
    }
    const zkappWorkerClient = await initZkWorker();
    console.log("zkappWorkerClient=", zkappWorkerClient);
    await zkappWorkerClient!.createDeployTransaction(
      currentAccount,
      keys.privateKey
    );
    await zkappWorkerClient!.proveDeployTransaction();

    const transactionJSON = await zkappWorkerClient!.getDeployTransactionJSON();
    console.log("waiting wallet confirm");
    setCreateTokenTxt("waiting wallet confirm");

    const sendRes: SendTransactionResult | ProviderError = await (
      window as any
    ).mina.sendTransaction({
      transaction: transactionJSON,
      feePayer: {
        memo: "",
      },
    });
    console.log("sendRes", sendRes);
    if ((sendRes as SendTransactionResult).hash) {
      const hash = (sendRes as SendTransactionResult).hash;
      setCreateTokenTxt(hash + "\n" + "Wainting confirm");
      startLoop(hash, "CREATE");
    } else {
      setCreateTokenTxt((sendRes as ProviderError).message);
    }
  }, [currentAccount, gqlUrl, keys, zkappWorkerClient, initZkWorker]);

  const startLoop = useCallback(
    async (txHash: string, type: ZkTokenLoopType) => {
      const controller = new TxLoopController(gqlUrl);
      const res = await controller.pollTransaction(txHash);
      const isSuccess = res.success;
      switch (type) {
        case "CREATE":
          if (isSuccess) {
            setMintBtnStatus(false);
            setCreateTokenTxt((state) =>
              state.replace(/\n.*/, "\nTransaction successful!")
            );
          } else {
            setCreateTokenTxt(String(res.failureReason));
          }
          break;
        case "MINT":
          if (isSuccess) {
            setDepositBtnStatus(false);
            setMintTokenTxt((state) =>
              state.replace(/\n.*/, "\nTransaction successful!")
            );
          } else {
            setMintTokenTxt(String(res.failureReason));
          }
          break;
        case "DEPOSIT":
          if (isSuccess) {
            setDepositTokenTxt((state) =>
              state.replace(/\n.*/, "\nTransaction successful!")
            );
          } else {
            setDepositTokenTxt(String(res.failureReason));
          }
          break;
        default:
          break;
      }
    },
    [gqlUrl]
  );

  const onClickCreateKey = useCallback(async () => {
    const keys = getNewAccount();
    console.log("keys", keys);
    setKeys({
      publicKey: keys.pub_58,
      privateKey: keys.pri_58,
    });
  }, []);

  const keysContent = useMemo(() => {
    let content = "";
    if (keys.privateKey) {
      content = JSON.stringify(keys, null, 2);
    }
    return content;
  }, [keys]);

  const onMintToken = useCallback(async () => {
    const zkappWorkerClient = await initZkWorker();
    console.log("zkappWorkerClient=", zkappWorkerClient);
    const mintAmount = 100000 * 1e9;

    await zkappWorkerClient!.createMintTransaction(
      currentAccount,
      keys.privateKey,
      mintAmount
    );
    await zkappWorkerClient!.proveMintTransaction();

    const transactionJSON = await zkappWorkerClient!.getMintTransactionJSON();
    console.log("waiting wallet confirm");
    setMintTokenTxt("waiting wallet confirm");

    const sendRes: SendTransactionResult | ProviderError = await (
      window as any
    ).mina.sendTransaction({
      transaction: transactionJSON,
      feePayer: {
        memo: "",
      },
    });
    console.log("sendRes", sendRes);
    if ((sendRes as SendTransactionResult).hash) {
      const hash = (sendRes as SendTransactionResult).hash;
      setMintTokenTxt(hash + "\n" + "Wainting confirm");
      startLoop(hash, "MINT");
    } else {
      setMintTokenTxt((sendRes as ProviderError).message);
    }
  }, [currentAccount, gqlUrl, keys, zkappWorkerClient, initZkWorker]);

  const onDepositToken = useCallback(async () => {
    const zkappWorkerClient = await initZkWorker();
    console.log("zkappWorkerClient=", zkappWorkerClient);
    const depositAmount = 2 * 1e9;
    await zkappWorkerClient!.createDepositTransaction(
      currentAccount,
      receiveAddress || currentAccount,
      depositAmount
    );
    await zkappWorkerClient!.proveDepositTransaction();

    const transactionJSON =
      await zkappWorkerClient!.getDepositTransactionJSON();
    console.log("waiting wallet confirm", JSON.stringify(transactionJSON));
    setDepositTokenTxt("waiting wallet confirm");

    const sendRes: SendTransactionResult | ProviderError = await (
      window as any
    ).mina.sendTransaction({
      transaction: transactionJSON,
      feePayer: {
        memo: "",
      },
    });
    console.log("sendRes", sendRes);
    if ((sendRes as SendTransactionResult).hash) {
      const hash = (sendRes as SendTransactionResult).hash;
      setDepositTokenTxt(hash + "\n" + "Wainting confirm");
      startLoop(hash, "DEPOSIT");
    } else {
      setDepositTokenTxt((sendRes as ProviderError).message);
    }
  }, [
    currentAccount,
    gqlUrl,
    keys,
    zkappWorkerClient,
    initZkWorker,
    receiveAddress,
  ]);
  return (
    <Box>
      <StyledBoxTitle>Mina Token</StyledBoxTitle>
      * need input url and generate Key first
      <Input
        placeholder="Input Graphql Url"
        value={gqlUrl}
        onChange={onChangeGqlUrl}
      />
      <StyledDividedLine />
      <Button onClick={onClickCreateKey}>Generate Token Key</Button>
      <InfoRow title={"token keys"} type={InfoType.secondary}>
        {keysContent && <div>{keysContent}</div>}
      </InfoRow>
      <StyledDividedLine />
      <Button onClick={createTokenContract}>Create Token Contract</Button>
      <InfoRow
        title={"Create Token Result: "}
        content={createTokenTxt}
        type={InfoType.secondary}
      />
      <StyledDividedLine />
      <Button disabled={mintBtnStatus} onClick={onMintToken}>
        Mint Token
      </Button>
      <InfoRow
        title={"Mint Token Result: "}
        content={mintTokenTxt}
        type={InfoType.secondary}
      />
      <StyledDividedLine />
      <Input
        placeholder="Set Receive Address"
        onChange={onChangeReceiveAddress}
      />
      <Button disabled={depositBtnStatus} onClick={onDepositToken}>
        Deposit Token
      </Button>
      <InfoRow
        title={"Deposit Token Result: "}
        content={depositTokenTxt}
        type={InfoType.secondary}
      />
    </Box>
  );
};
