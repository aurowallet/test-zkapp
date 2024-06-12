import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { useCallback, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { ChainInfoArgs, ProviderError, SignedData } from "@aurowallet/mina-provider";

export const SignTypeMessageBox = ({
  currentAccount,
  network,
}: {
  currentAccount: string;
  network: ChainInfoArgs;
}) => {
  const [verifyBtnStatus, setVerifyBtnStatus] = useState(true);
  const [verifyContent, setVerifyContent] = useState("");
  const [verifySignature, setVerifySignature] = useState("");
  const [signRes, setSignRes] = useState("");
  const [verifyRes, setVerifyRes] = useState("");

  const [verifyJsonBtnStatus, setVerifyJsonBtnStatus] = useState(true);
  const [verifyJsonContent, setVerifyJsonContent] = useState("");
  const [verifyJsonSignature, setVerifyJsonSignature] = useState("");
  const [signJsonRes, setJsonSignRes] = useState("");
  const [verifyJsonRes, setVerifyJsonRes] = useState("");

  const onSignType = useCallback(async () => {
    const content = `Click "Sign" to sign in. No password needed!

This request will not trigger a blockchain transaction or cost any gas fees.

I accept the Auro Test zkApp Terms of Service: ${window.location.href}

address: ${currentAccount}
iat: ${new Date().getTime()}`;
    const signResult: SignedData|ProviderError = await (window as any)?.mina
      ?.signMessage({
        message: content,
      })
      .catch((err: any) => err);

    if ((signResult as SignedData).signature) {
      setSignRes(JSON.stringify((signResult as SignedData).signature));
      setVerifyBtnStatus(false);

      setVerifyContent((signResult as SignedData).data + "");
      setVerifySignature(JSON.stringify((signResult as SignedData).signature));
    } else {
      setSignRes((signResult as ProviderError).message || "");
      setVerifyBtnStatus(true);
      setVerifyRes("");
    }
  }, []);
  const onVerifyType = useCallback(async () => {
    let verifyMessageBody = {
      publicKey: currentAccount,
      signature: verifySignature,
      data: verifyContent,
    };

    let verifyResult:boolean|ProviderError = await (window as any)?.mina
      ?.verifyMessage(verifyMessageBody)
      .catch((err: any) => err);
    if ((verifyResult as ProviderError).message) {
      setVerifyRes((verifyResult as ProviderError).message);
    } else {
      setVerifyRes(verifyResult + "");
    }
  }, [currentAccount, verifyContent, verifySignature]);

  const onSignJson = useCallback(async () => {
    const msgParams = [
      { label: "Label:", value: "Sign Confirm" },
      {
        label: "Message:",
        value: "Click to sign in and accept the Terms of Service",
      },
      {
        label: "URI:",
        value: "window.location.href",
      },
      {
        label: "networkID:",
        value: network.networkID,
      },
      {
        label: "Issued At:",
        value: new Date().getTime(),
      },
      {
        label: "Resources:",
        value: "https://docs.aurowallet.com/",
      },
    ];
    const signResult:SignedData|ProviderError = await (window as any)?.mina
      ?.signJsonMessage({
        message: msgParams
      })
      .catch((err: any) => err);

    if ((signResult as SignedData).signature) {
      setJsonSignRes(JSON.stringify((signResult as SignedData).signature));
      setVerifyJsonBtnStatus(false);

      setVerifyJsonContent((signResult as SignedData).data + "");
      setVerifyJsonSignature(
        JSON.stringify((signResult as SignedData).signature)
      );
    } else {
      setJsonSignRes((signResult as ProviderError).message || "");
      setVerifyJsonBtnStatus(true);
      setVerifyJsonRes("");
    }
  }, [network]);
  const onVerifyJson = useCallback(async () => {
    let verifyMessageBody = {
      publicKey: currentAccount,
      signature: verifyJsonSignature,
      data: verifyJsonContent,
    };

    let verifyResult:boolean|ProviderError = await (window as any)?.mina
      ?.verifyMessage(verifyMessageBody)
      .catch((err: any) => err);
    if ((verifyResult as ProviderError).message) {
      setVerifyJsonRes((verifyResult as ProviderError)?.message);
    } else {
      setVerifyJsonRes(verifyResult + "");
    }
  }, [currentAccount, verifyJsonContent, verifyJsonSignature]);
  return (
    <Box>
      <StyledBoxTitle>Mina Sign Type Message</StyledBoxTitle>
      <Button onClick={onSignType}>Sign Type Message</Button>
      <InfoRow
        title="Sign Type Message result: "
        content={signRes}
        type={InfoType.secondary}
      />
      <Button onClick={onVerifyType} disabled={verifyBtnStatus}>
        Verify Type Message
      </Button>
      <InfoRow
        title="Verify Type Message result: "
        content={verifyRes}
        type={InfoType.secondary}
      />

      <StyledDividedLine />

      <Button onClick={onSignJson}>Sign Json Message</Button>
      <InfoRow
        title="Sign Json Message result: "
        content={signJsonRes}
        type={InfoType.secondary}
      />
      <Button onClick={onVerifyJson} disabled={verifyJsonBtnStatus}>
        Verify Json Message
      </Button>
      <InfoRow
        title="Verify Json Message result: "
        content={verifyJsonRes}
        type={InfoType.secondary}
      />
    </Box>
  );
};
