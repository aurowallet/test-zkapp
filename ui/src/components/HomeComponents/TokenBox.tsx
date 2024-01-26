import ZkappTokenWorkerClient from "@/contracts/token/zkappTokenWorkerClient";
import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { timeout } from "@/utils";
import {
  ProviderError,
  SendTransactionResult,
} from "@aurowallet/mina-provider";
import { PrivateKey, PublicKey } from "o1js";
import { useCallback, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";

export const TokenBox = ({ currentAccount }: { currentAccount: string }) => {
  const [createBtnStatus, setCreateBtnStatus] = useState(false);
  const [createTokenRes, setCreateTokenRes] = useState({
    status: false,
    text: "",
  });
  const [sendTokenRes, setSendTokenRes] = useState({
    status: false,
    text: "",
  });
  const [sendAmount, setSendAmount] = useState(0);
  const [receiveAddress, setReceiveAddress] = useState("");

  const onChangeAmount = useCallback((e: any) => {
    setSendAmount(e.target.value);
  }, []);

  const onChangeReceiveAddress = useCallback((e: any) => {
    setReceiveAddress(e.target.value);
  }, []);

  // create token process
  const onClickToken = useCallback(async () => {
    // 1. create token key
    const hooksKey = PrivateKey.random();
    const hooksAccount = hooksKey.toPublicKey();
    const hooksKeys = {
      pri: hooksKey.toBase58(),
      pub: hooksAccount.toBase58(),
    };
    console.log("hooksKeys", hooksKeys);
    const directAdminKey = PrivateKey.random();
    const directAdminAccount = directAdminKey.toPublicKey();

    const directAdminKeys = {
      pri: directAdminKey.toBase58(),
      pub: directAdminAccount.toBase58(),
    };

    console.log("directAdminKeys", directAdminKeys);

    const gqlUrl = "";
    // 2. init client
    const zkappWorkerClient = new ZkappTokenWorkerClient();
    await timeout(5);
    console.log("Done loading web worker");
    await zkappWorkerClient.setActiveInstanceToZk(gqlUrl);

    // 3. init paye key
    const publicKey = PublicKey.fromBase58(currentAccount);
    console.log(`Using key:${publicKey.toBase58()}`);
    console.log("Checking if fee payer account exists...");
    const res = await zkappWorkerClient.fetchAccount({
      publicKey: publicKey!,
    });
    console.log("res...", res);
    await zkappWorkerClient.loadHooksContract();
    console.log("Compiling zkApp...");
    await zkappWorkerClient.compileHooksContract();
    console.log("compiled");

    // 4. build contract
    await zkappWorkerClient.initHooksInstance(hooksKeys.pub);
    console.log("initHooksInstance done");

    await zkappWorkerClient.createDeployHooksTransaction(
      currentAccount,
      directAdminKeys.pub,
      hooksKeys.pri
    );
    console.log("createDeployHooksTransaction done");
    await zkappWorkerClient.proveUpdateTransactionHk();
    console.log("proveUpdateTransactionHk done");
    const transactionJSON = await zkappWorkerClient.getTransactionHkJSON();
    console.log("waiting wallet confirm");

    const sendRes: SendTransactionResult | ProviderError = await (
      window as any
    ).mina.sendTransaction({
      transaction: transactionJSON,
      feePayer: {
        memo: "",
      },
    });
    console.log("sendRes", sendRes);
  }, [currentAccount]);

  const onCheckToken = useCallback(async () => {}, []);
  const onSendToken = useCallback(async () => {}, [sendAmount, receiveAddress]);

  return (
    <Box>
      <StyledBoxTitle>Mina Token</StyledBoxTitle>
      <Button onClick={onClickToken}>Create Token</Button>
      <InfoRow
        title={"Create Token Result: "}
        content={createTokenRes.text}
        type={InfoType.secondary}
      />
      <Button disabled={createBtnStatus} onClick={onCheckToken}>
        Check Token Status
      </Button>
      <StyledDividedLine />
      <Input
        placeholder="Set Receive Address"
        onChange={onChangeReceiveAddress}
      />
      <Input placeholder="Set Amount" onChange={onChangeAmount} />
      <Button disabled={createBtnStatus} onClick={onSendToken}>
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
