import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { useCallback, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";
import { ProviderError, SignedData } from "@aurowallet/mina-provider";

export const SignMessageBox = ({
  currentAccount,
}: {
  currentAccount: string;
}) => {
  const [signContent, setSignContent] = useState("");
  const [verifyBtnStatus, setVerifyBtnStatus] = useState(true);

  const [verifyContent, setVerifyContent] = useState("");
  const [verifySignature, setVerifySignature] = useState("");
  const [signRes, setSignRes] = useState("");
  const [verifyRes, setVerifyRes] = useState("");

  const onChangeSignContent = useCallback((e: any) => {
    setSignContent(e.target.value);
  }, []);
  const onChangeVerifyContent = useCallback((e: any) => {
    setVerifyContent(e.target.value);
  }, []);
  const onChangeVerifySignature = useCallback((e: any) => {
    setVerifySignature(e.target.value);
  }, []);

  const onSign = useCallback(async () => {
    const signResult: SignedData|ProviderError = await (window as any)?.mina
      ?.signMessage({
        message: signContent,
      })
      .catch((err: any) => err);

    if ((signResult as SignedData).signature) {
      setSignRes(JSON.stringify((signResult as SignedData).signature));
      setVerifyBtnStatus(false);

      setVerifyContent((signResult as SignedData).data + "");
      setVerifySignature(JSON.stringify((signResult as SignedData).signature));
    } else {
      setSignRes((signResult as ProviderError).message || "");
    }
  }, [signContent]);
  const onVerify = useCallback(async () => {
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
  return (
    <Box>
      <StyledBoxTitle>Mina Sign</StyledBoxTitle>
      <Input placeholder="Set sign content" onChange={onChangeSignContent} />
      <Button onClick={onSign}>Sign</Button>
      <InfoRow
        title="Sign result: "
        content={signRes}
        type={InfoType.secondary}
      />
      <StyledDividedLine />

      <Input
        placeholder={"Set Verify Message"}
        onChange={onChangeVerifyContent}
        value={verifyContent}
      />
      <Input
        placeholder={"Set Verify Signature"}
        onChange={onChangeVerifySignature}
        value={verifySignature}
      />
      <Button onClick={onVerify} disabled={verifyBtnStatus}>
        Verify
      </Button>
      <InfoRow
        title="Verify result: "
        content={verifyRes}
        type={InfoType.secondary}
      />
    </Box>
  );
};
