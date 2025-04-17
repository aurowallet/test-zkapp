import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import {
  IRequestPresentation,
  IStoreCredentialData,
} from "@aurowallet/mina-provider";
import { PresentationRequest } from "mina-attestations";
import { UInt64 } from "o1js";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import styled from "styled-components";
import { Button } from "../Button";

const StyledButtonGroup = styled.div`
  display: flex;
  > :not(:first-child) {
    margin-left: 20px;
  }
`;
const StyledBaseTextarea = styled.textarea`
  border: 1px solid rgba(0.2, 0.2, 0.2, 0.1);
  border-radius: 8px;
  padding: 10px;
  font-size: 16px;
  resize: none;
  outline: none;
  margin-bottom: 10px;
`;

export const CredentialBox = ({
  currentAccount,
}: {
  currentAccount: string;
}) => {
  const [isStoring, setIsStoring] = useState(false);
  const [isLoading, setIsLoading] = useState<string | undefined>(undefined);
  const [credential, setCredential] = useState<{
    sourceData: any;
    credential: string;
  }>();

  const onGenerateCredential = useCallback(async () => {
    const { issueCredential } = require("@/utils/credential");
    const data = issueCredential(currentAccount);
    setCredential(data);
    navigator.clipboard.writeText(data.credential);
  }, [currentAccount]);
  const onStoreCredential = useCallback(async () => {
    try {
      setIsStoring(true);
      const storeResult: IStoreCredentialData = await (window as any)?.mina
        .storePrivateCredential({
          credential: JSON.parse(credential?.credential as string),
        })
        .catch((err: any) => err);
      if (storeResult.credential) {
        toast.success("Store Successfully!");
      } else {
        toast.error("Store Failed!");
      }
    } catch (error) {
      console.log("onStoreCredential error", error);
      toast.error("Store Failed!");
    } finally {
      setIsStoring(false);
    }
  }, [credential]);

  const onRequestPresentation = useCallback(async () => {
    setIsLoading("Loading...");
    const { createRequest, verifyLogin } = require("@/utils/credential");

    const step1_request = await createRequest(UInt64.from(Date.now()));
    const step1_res = PresentationRequest.toJSON(step1_request);
    let presentationSource: string;
    try {
      setIsLoading("Awaiting proof from wallet...");
      const storeResult: IRequestPresentation = await (window as any)?.mina
        .requestPresentation({
          presentation: {
            presentationRequest: JSON.parse(step1_res as string),
          },
        })
        .catch((err: any) => err);
      presentationSource = storeResult.presentation;
      await verifyLogin(presentationSource);
      toast.success("Login Successfully!");
    } catch (error) {
      console.log("storeResult==error", error);
      toast.error("Request Presentation Failed!");
    } finally {
      setIsLoading(undefined);
    }
  }, []);

  return (
    <Box>
      <StyledBoxTitle>Mina Credential</StyledBoxTitle>
      <StyledBaseTextarea
        readOnly
        value={JSON.stringify(credential, null, 2)}
      />
      <StyledButtonGroup>
        <Button onClick={onGenerateCredential}>
          Generate Credential & Copy
        </Button>
        <Button disabled={isStoring} onClick={onStoreCredential}>
          {isStoring ? "Storing..." : "Store Credential"}
        </Button>
      </StyledButtonGroup>
      <StyledDividedLine />
      <Button disabled={!!isLoading} onClick={onRequestPresentation}>
        {isLoading ?? "Anonymous Login"}
      </Button>
    </Box>
  );
};
