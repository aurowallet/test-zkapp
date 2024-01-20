import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { useCallback, useState } from "react";
import styled from "styled-components";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";
import { PrivateKey, PublicKey } from "o1js";
import ZkappTokenWorkerClient from "@/contracts/token/zkappTokenWorkerClient";
import { timeout } from "@/utils";
import { ProviderError, SendTransactionResult } from "@aurowallet/mina-provider";

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

    const payKey = {
      pri: "",
      pub: "",
    };
    // 1. create token key
    let zkAppPrivateKey = PrivateKey.random();
    let zkAppAddress = zkAppPrivateKey.toPublicKey();

    const zkKeys = {
      pri:zkAppPrivateKey,
      pub:zkAppAddress
    }
    const gqlUrl = "";
    // 2. init client
    const zkappWorkerClient = new ZkappTokenWorkerClient();
    await timeout(5);
    console.log("Done loading web worker");
    await zkappWorkerClient.setActiveInstanceToBerkeley(gqlUrl);

    // 3. init paye key
    const publicKey = PublicKey.fromBase58(payKey.pub);
    console.log(`Using key:${publicKey.toBase58()}`);
    console.log("Checking if fee payer account exists...");
    const res = await zkappWorkerClient.fetchAccount({
      publicKey: publicKey!,
    });
    console.log("res...",res);
    await zkappWorkerClient.loadContract();
    console.log("Compiling zkApp...");
    await zkappWorkerClient.compileContract();
    console.log("zkApp compiled");

    // 4. build contract
    await zkappWorkerClient.initZkappInstance(zkKeys.pub);
    await zkappWorkerClient.createDeployTransaction(
      zkKeys.pri,
      payKey.pub
    );
    await zkappWorkerClient.proveUpdateTransaction();
    const transactionJSON = await zkappWorkerClient.getTransactionJSON();
    console.log("waiting wallet confirm")
      

    const sendRes:SendTransactionResult|ProviderError = await (window as any).mina.sendTransaction({
      transaction: transactionJSON,
      feePayer: {
        memo: "",
      },
    });
    console.log('sendRes',sendRes);
  }, []);

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
