import { BaseActionBox } from "@/components/HomeComponents/BasicActionBox.tsx";
import { MinaSendBox } from "@/components/HomeComponents/SendBox.tsx";
import { SignFieldsBox } from "@/components/HomeComponents/SignFieldsBox.tsx";
import { SignMessageBox } from "@/components/HomeComponents/SignMessageBox.tsx";
import { SignTransactionBox } from "@/components/HomeComponents/SignTransactionBox";
import { StakingBox } from "@/components/HomeComponents/StakingBox.tsx";
import { InfoRow, InfoType } from "@/components/InfoRow.tsx";
import {
  Container,
  PageContainer,
  StyledPageTitle,
  StyledRowSection,
  StyledRowTitle,
  StyledStatusRowWrapper,
} from "@/styles/HomeStyles.ts";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [currentNetwork, setCurrentNetwork] = useState("");

  const initNetwork = useCallback(async () => {
    const network = await (window as any)?.mina
      ?.requestNetwork()
      .catch((err: any) => err);
    setCurrentNetwork(network);
  }, []);

  useEffect(() => {
    (window as any)?.mina?.on("accountsChanged", async (accounts: string[]) => {
      console.log("accountsChanged", accounts);
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
      }else{
        const data = await (window as any)?.mina
        .requestAccounts()
        .catch((err: any) => err);
        if(Array.isArray(data) && data.length>0){
          setCurrentAccount(data[0]);
        }
      }
    });
    (window as any)?.mina?.on("chainChanged", async (chain: string) => {
      console.log("chainChanged");
      setCurrentNetwork(chain);
    });
    initNetwork();
  }, []);

  const initAccount = useCallback(async () => {
    const data = await (window as any)?.mina
      ?.requestAccounts()
      .catch((err: any) => err);
    if (Array.isArray(data) && data.length > 0) {
      setCurrentAccount(data[0]);
    }
  }, []);
  useEffect(() => {
    initAccount();
  }, []);

  return (
    <PageContainer>
      <Head>
        <link rel="shortcut icon" href="/imgs/auro.png" />
      </Head>
      <header>
        <StyledPageTitle>AURO E2E Test zkApp</StyledPageTitle>
      </header>
      {/* status + account  */}
      <StyledRowSection>
        <StyledRowTitle>Status</StyledRowTitle>
        <Container>
          <StyledStatusRowWrapper>
            <InfoRow
              title="Network: "
              content={currentNetwork}
              type={InfoType.primary}
            />
          </StyledStatusRowWrapper>
          <StyledStatusRowWrapper>
            <InfoRow
              title="Accounts: "
              content={currentAccount}
              type={InfoType.success}
            />
          </StyledStatusRowWrapper>
        </Container>
      </StyledRowSection>
      <Container>
        {/* connect and get account */}
        <BaseActionBox currentAccount={currentAccount} />
        {/* send  */}
        <MinaSendBox network={currentNetwork} />
        {/* stake */}
        <StakingBox network={currentNetwork} />
        {/* sign message */}
        <SignMessageBox currentAccount={currentAccount} />
        {/* sign fields */}
        <SignFieldsBox currentAccount={currentAccount} />
        {/* zk app */}
        <SignTransactionBox network={currentNetwork} />
      </Container>
    </PageContainer>
  );
}
