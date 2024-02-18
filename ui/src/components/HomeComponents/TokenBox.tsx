import ZkappTokenWorkerClient from "@/contracts/basicToken/zkappWorkerClient";
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
  const [sendBtnStatus, setSendBtnStatus] = useState(true);

  const [createTokenTxt, setCreateTokenTxt] = useState("");

  const [sendTokenRes, setSendTokenRes] = useState({
    status: false,
    text: "",
  });

  const [sendAmount, setSendAmount] = useState(0);
  const [receiveAddress, setReceiveAddress] = useState("");
  const [gqlUrl, setGqlUrl] = useState(
    "https://mina-berkeley-graphql.aurowallet.com"
  );
  const [keys, setKeys] = useState({
    publicKey: "",
    privateKey: "",
  });

  const onChangeGqlUrl = useCallback((e: any) => {
    setGqlUrl(e.target.value);
  }, []);

  const onChangeAmount = useCallback((e: any) => {
    setSendAmount(e.target.value);
  }, []);

  const onChangeReceiveAddress = useCallback((e: any) => {
    setReceiveAddress(e.target.value);
  }, []);

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
    // 2. init client
    const zkappWorkerClient = new ZkappTokenWorkerClient();
    await timeout(5);
    console.log("Done loading web worker");
    setCreateTokenTxt("Done loading web worker");
    await zkappWorkerClient.setActiveInstanceToBerkeley(gqlUrl);

    // 3. init paye key
    const publicKey = PublicKey.fromBase58(currentAccount);
    console.log(`Using key:${publicKey.toBase58()}`);
    setCreateTokenTxt(`Using key:${publicKey.toBase58()}`);
    console.log("Checking if fee payer account exists...");
    setCreateTokenTxt("Checking if fee payer account exists...");

    const res = await zkappWorkerClient.fetchAccount({
      publicKey: publicKey!,
    });
    console.log("res...", res);
    await zkappWorkerClient.loadContract();
    console.log("Compiling zkApp...");
    setCreateTokenTxt("Compiling zkApp...");
    await zkappWorkerClient.compileContract();
    console.log("compiled");
    setCreateTokenTxt("compiled");
    // 4. build contract
    await zkappWorkerClient.initZkappInstance(keys.publicKey);
    console.log("initZkappInstance done");
    setCreateTokenTxt("initZkappInstance done");
    await zkappWorkerClient.createDeployTransaction(
      currentAccount,
      keys.privateKey
    );
    await zkappWorkerClient!.proveDeployTransaction();

    const transactionJSON = await zkappWorkerClient.getDeployTransactionJSON();
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
  }, [currentAccount, gqlUrl, keys]);

  const startLoop = useCallback(
    async (txHash: string, type: ZkTokenLoopType) => {
      const controller = new TxLoopController(gqlUrl);
      const res = await controller.pollTransaction(txHash);
      if (res.success) {
        setMintBtnStatus(false);
      } else {
        switch (type) {
          case "CREATE":
            setCreateTokenTxt(String(res.failureReason));
            break;

          default:
            break;
        }
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

  const onMintToken = useCallback(async () => {}, []);
  const onDepositToken = useCallback(async () => {}, []);
  const onSendToken = useCallback(async () => {}, [sendAmount, receiveAddress]);

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
      <StyledDividedLine />
      <Button disabled={depositBtnStatus} onClick={onDepositToken}>
        Deposit Token
      </Button>
      {/* <Button disabled={mintBtnStatus} onClick={onCheckToken}>
        Check Token Status
      </Button> */}
      <StyledDividedLine />
      <Input
        placeholder="Set Receive Address"
        onChange={onChangeReceiveAddress}
      />
      <Input placeholder="Set Amount" onChange={onChangeAmount} />
      <Button disabled={mintBtnStatus} onClick={onSendToken}>
        {"Send Token"}
      </Button>
      <InfoRow
        title={"Send Token State: "}
        content={sendTokenRes.text}
        type={InfoType.secondary}
      />
    </Box>
  );
};
