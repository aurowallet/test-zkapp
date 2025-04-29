import { useMinaProvider } from "@/context/MinaProviderContext";
import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { ProviderError, SignedData } from "@aurowallet/mina-provider";
import { useCallback, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";

export const SignFieldsBox = ({
  currentAccount,
}: {
  currentAccount: string;
}) => {
  const { provider } = useMinaProvider();

  const [signContent, setSignContent] = useState("");
  const [verifyBtnStatus, setVerifyBtnStatus] = useState(true);

  const [verifyContent, setVerifyContent] = useState("");
  const [verifySignature, setVerifySignature] = useState<any>();
  const [signRes, setSignRes] = useState<any>();
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
    try {
      const signResult: SignedData | ProviderError = await provider
        ?.signFields({
          message: JSON.parse(signContent),
        })
        .catch((err: any) => err);

      if ((signResult as SignedData).signature) {
        setSignRes((signResult as SignedData).signature);
        setVerifyBtnStatus(false);

        setVerifyContent(JSON.stringify(signResult.data));
        setVerifySignature((signResult as SignedData).signature);
      } else {
        setSignRes((signResult as ProviderError).message || "");
      }
    } catch (error) {
      console.warn(error);
    }
  }, [signContent, provider]);
  const onVerify = useCallback(async () => {
    let verifyMessageBody = {
      publicKey: currentAccount,
      signature: verifySignature,
      data: JSON.parse(verifyContent),
    };
    try {
      verifyMessageBody.data = JSON.parse(verifyContent);
    } catch (error) {
      setVerifyRes("Please check verify message");
      return;
    }
    let verifyResult: boolean | ProviderError = await provider
      ?.verifyFields(verifyMessageBody)
      .catch((err: any) => err);
    if ((verifyResult as ProviderError).message) {
      setVerifyRes((verifyResult as ProviderError).message);
    } else {
      setVerifyRes(verifyResult + "");
    }
  }, [currentAccount, verifyContent, verifySignature]);

  return (
    <Box>
      <StyledBoxTitle>Mina Fields</StyledBoxTitle>
      <Input
        placeholder="Set sign content (eg: ['1','2','3',...])"
        onChange={onChangeSignContent}
      />
      <Button checkConnection={true} onClick={onSign}>
        Sign
      </Button>
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
      <Button
        checkConnection={true}
        onClick={onVerify}
        disabled={verifyBtnStatus}
      >
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
