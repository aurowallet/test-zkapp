import { useMinaProvider } from "@/context/MinaProviderContext";
import { useTranslation } from "@/context/LanguageContext";
import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import {
  ChainInfoArgs,
  ProviderError,
  SignedData,
} from "@aurowallet/mina-provider";
import { useCallback, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";

export const SignTypeMessageBox = ({
  currentAccount,
  network,
}: {
  currentAccount: string;
  network: ChainInfoArgs;
}) => {
  const { provider } = useMinaProvider();
  const { t } = useTranslation();

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

    const signResult: SignedData | ProviderError = await provider
      ?.signMessage({
        message: content,
      })
      .catch((err: any) => err);
    if ((signResult as SignedData)?.signature) {
      setSignRes(JSON.stringify((signResult as SignedData).signature));
      setVerifyBtnStatus(false);

      setVerifyContent((signResult as SignedData).data + "");
      setVerifySignature(JSON.stringify((signResult as SignedData).signature));
    } else {
      setSignRes((signResult as ProviderError).message || "");
      setVerifyBtnStatus(true);
      setVerifyRes("");
    }
  }, [currentAccount, provider]);
  const onVerifyType = useCallback(async () => {
    let verifyMessageBody = {
      publicKey: currentAccount,
      signature: verifySignature as any,
      data: verifyContent,
    };

    let verifyResult: boolean | ProviderError = await provider
      ?.verifyMessage(verifyMessageBody)
      .catch((err: any) => err);
    if ((verifyResult as ProviderError).message) {
      setVerifyRes((verifyResult as ProviderError).message);
    } else {
      setVerifyRes(verifyResult + "");
    }
  }, [currentAccount, verifyContent, verifySignature, provider]);

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
        value: new Date().getTime().toString(),
      },
      {
        label: "Resources:",
        value: "https://docs.aurowallet.com/",
      },
    ];
    const signResult: SignedData | ProviderError = await provider
      ?.signJsonMessage({
        message: msgParams,
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
  }, [network, provider]);
  const onVerifyJson = useCallback(async () => {
    let verifyMessageBody = {
      publicKey: currentAccount,
      signature: verifyJsonSignature as any,
      data: verifyJsonContent,
    };

    let verifyResult: boolean | ProviderError = await provider
      ?.verifyMessage(verifyMessageBody)
      .catch((err: any) => err);
    if ((verifyResult as ProviderError).message) {
      setVerifyJsonRes((verifyResult as ProviderError)?.message);
    } else {
      setVerifyJsonRes(verifyResult + "");
    }
  }, [currentAccount, verifyJsonContent, verifyJsonSignature, provider]);
  return (
    <Box>
      <StyledBoxTitle>Mina Sign Type Message</StyledBoxTitle>
      <Button checkConnection={true} onClick={onSignType}>
        {t.signTypeMessage.signTypeMessage}
      </Button>
      <InfoRow
        title={`${t.signTypeMessage.signTypeMessageResult}: `}
        content={signRes}
        type={InfoType.secondary}
      />
      <Button
        checkConnection={true}
        onClick={onVerifyType}
        disabled={verifyBtnStatus}
      >
        {t.signTypeMessage.verifyTypeMessage}
      </Button>
      <InfoRow
        title={`${t.signTypeMessage.verifyTypeMessageResult}: `}
        content={verifyRes}
        type={InfoType.secondary}
      />

      <StyledDividedLine />

      <Button checkConnection={true} onClick={onSignJson}>
        {t.signTypeMessage.signJsonMessage}
      </Button>
      <InfoRow
        title={`${t.signTypeMessage.signJsonMessageResult}: `}
        content={signJsonRes}
        type={InfoType.secondary}
      />
      <Button
        checkConnection={true}
        onClick={onVerifyJson}
        disabled={verifyJsonBtnStatus}
      >
        {t.signTypeMessage.verifyJsonMessage}
      </Button>
      <InfoRow
        title={`${t.signTypeMessage.verifyJsonMessageResult}: `}
        content={verifyJsonRes}
        type={InfoType.secondary}
      />
    </Box>
  );
};
