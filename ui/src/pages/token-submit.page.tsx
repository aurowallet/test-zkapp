import { Button } from "@/components/Button";
import { PageHead } from "@/components/PageHead";
import { useMinaProvider } from "@/context/MinaProviderContext";
import { StyledDividedLine, StyledPageTitle } from "@/styles/HomeStyles";
import { addressSlice } from "@/utils";
import { ProviderError, SignedData } from "@aurowallet/mina-provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

interface ButtonProps {
  color?: string;
  textColor?: string;
  onClick?: () => void;
}
const StyledPageWrapper = styled.div`
  background-color: #edeff2;
  height: 100%;
`;

const StyledButton = styled.button<ButtonProps>`
  background-color: ${({ color }) => color || "#6c5ce7"};
  color: ${({ textColor }) => textColor || "#ffffff"};
  border: none;
  border-radius: 25px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${({ color }) => color || "#5a4db2"};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const StyledBaseTextarea = styled.textarea`
  width: 800px;
  height: 200px;
  border: 1px solid rgba(0.2, 0.2, 0.2, 0.1);
  border-radius: 8px;
  padding: 10px;
  font-size: 16px;
  resize: none;
  outline: none;
`;
const StyledTextarea = styled(StyledBaseTextarea)`
  border: 2px solid #ccc;
  &:focus {
    border-color: "rgba(89, 74, 241, 0.3)";
  }
`;

const StyledContentWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  > :not(:first-child) {
    margin-left: 20px;
  }
`;
const StyledLeftContent = styled.div`
  display: flex;
  flex-direction: column;
  :not(:first-child) {
    margin-top: 10px;
  }
`;
const StyledRowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 20px 50px 20px;
`;

const StyledButtonWraper = styled.div`
  display: flex;
  align-items: center;
  margin: 10px;
  width: 300px;
  > :not(:first-child) {
    margin-left: 20px;
  }
`;
const StyledBottomWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;
const StyledTextAreaTitle = styled.div`
  font-size: 28px;
`;
const StyledRowTitle = styled.div`
  padding: 20px;
  font-weight: 300;
  font-size: 2.5rem;
  color: #212529;
  text-align: left;
`;

const StyledSectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 auto;
`;
const COLORS_MAP = {
  clickable: {
    main: "#594af1",
    text: "white",
  },
  disable: {
    main: "rgba(89, 74, 241, 0.8)",
    text: "white",
  },
};
export default function TokenSubmit() {
  const { provider } = useMinaProvider();

  const [connectStatus, setConnectStatus] = useState<boolean>();
  const [currentAccount, setCurrentAccount] = useState("");
  const [inputData, setInputData] = useState("");
  const [signedData, setSignedData] = useState("");
  const [inputSourceData, setInputSourceData] = useState("");

  const [signResultData, setSignResultData] = useState("");
  const [verifyResultData, setVerifyResultData] = useState("");

  const initAccount = useCallback(async () => {
    const data: string[] | ProviderError = await provider
      ?.getAccounts()
      .catch((err: any) => err);
    if (Array.isArray(data) && data.length > 0) {
      setCurrentAccount(data[0]);
    }
  }, [provider]);
  useEffect(() => {
    provider?.on("accountsChanged", async (accounts: string[]) => {
      console.log("accountsChanged", accounts);
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
      } else {
        console.log("disconnect");
      }
    });
  }, [provider]);

  useEffect(() => {
    initAccount();
  }, []);
  useEffect(() => {
    if (currentAccount) {
      setConnectStatus(true);
    } else {
      setConnectStatus(false);
    }
  }, [currentAccount]);

  const { nextColorMap } = useMemo(() => {
    const nextColorMap = connectStatus
      ? COLORS_MAP.disable
      : COLORS_MAP.clickable;
    return {
      nextColorMap,
    };
  }, [connectStatus]);

  const onClick = useCallback(async () => {
    const data: string[] | ProviderError = await provider?.requestAccounts()
      .catch((err: any) => err);
    if ((data as ProviderError).message) {
    } else {
      let account = (data as string[])[0];
      setCurrentAccount(account);
    }
  }, [provider]);
  const onSign = useCallback(async () => {
    setVerifyResultData("");
    const signContent = inputData.trim();
    const signResult: SignedData | ProviderError = await provider
      ?.signMessage({
        message: JSON.stringify(signContent),
      })
      .catch((err: any) => err);

    if ((signResult as SignedData).signature) {
      setSignResultData(JSON.stringify((signResult as SignedData).signature));
    } else {
      setSignResultData((signResult as ProviderError).message || "");
    }
  }, [inputData,provider]);

  const onVerify = useCallback(async () => {
    let verifyMessageBody = {
      publicKey: currentAccount,
      signature: JSON.parse( signedData),
      data: JSON.stringify(inputSourceData),
    };

    let verifyResult: boolean | ProviderError = await provider
      ?.verifyMessage(verifyMessageBody)
      .catch((err: any) => err);
    if ((verifyResult as ProviderError).message) {
      setVerifyResultData((verifyResult as ProviderError).message);
    } else {
      setVerifyResultData(verifyResult + "");
    }
  }, [inputSourceData, signedData, currentAccount,provider]);
  const onCopy = useCallback(async () => {
    const res = await navigator.clipboard
      .writeText(signResultData)
      .catch((err) => err);
    if (!res) {
      alert(`Copy Success!`);
    }
  }, [signResultData]);

  const onInputArea = useCallback((e: any) => {
    setInputData(e.target.value);
  }, []);

  const onInputSignedData = useCallback((e: any) => {
    setSignedData(e.target.value);
  }, []);

  const onInputSourceArea = useCallback((e: any) => {
    setInputSourceData(e.target.value);
  }, []);
  return (
    <StyledPageWrapper>
      <PageHead />
      <header>
        <StyledPageTitle>Token Submit Utils</StyledPageTitle>
      </header>
      <StyledRowContainer>
        <StyledButton
          color={nextColorMap.main}
          textColor={nextColorMap.text}
          onClick={onClick}
        >
          {!connectStatus ? "Connect Wallet" : addressSlice(currentAccount)}
        </StyledButton>
      </StyledRowContainer>
      <StyledSectionWrapper>
        <StyledRowTitle>Sign</StyledRowTitle>
        <StyledContentWrapper>
          <StyledTextarea
            value={inputData}
            onChange={onInputArea}
            placeholder="Enter your unsign data here..."
          />
          <StyledTextAreaTitle>{"Result >>"}</StyledTextAreaTitle>
          <StyledBaseTextarea readOnly value={signResultData} />
        </StyledContentWrapper>
        <StyledBottomWrapper>
          <StyledButtonWraper>
            <Button onClick={onSign}>
              Sign
            </Button>
            <Button onClick={onCopy}>
              Copy Result
            </Button>
          </StyledButtonWraper>
        </StyledBottomWrapper>
      </StyledSectionWrapper>
      <StyledDividedLine></StyledDividedLine>
      <StyledSectionWrapper>
        <StyledRowTitle>Verify</StyledRowTitle>
        <StyledContentWrapper>
          <StyledLeftContent>
            <StyledTextarea
              value={inputSourceData}
              onChange={onInputSourceArea}
              placeholder={"Enter your source data here..."}
            />
            <StyledTextarea
              value={signedData}
              onChange={onInputSignedData}
              placeholder="Enter your signed data here..."
            />
          </StyledLeftContent>
          <StyledTextAreaTitle>{"Result >>"}</StyledTextAreaTitle>
          <StyledBaseTextarea readOnly value={verifyResultData} />
        </StyledContentWrapper>
        <StyledBottomWrapper>
          <StyledButtonWraper>
            <Button checkInstall={false} onClick={onVerify}>
              Verify
            </Button>
          </StyledButtonWraper>
        </StyledBottomWrapper>
      </StyledSectionWrapper>
    </StyledPageWrapper>
  );
}
