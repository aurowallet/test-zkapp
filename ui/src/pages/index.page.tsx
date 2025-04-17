"use client";

import { GithubCorner } from "@/components/GithubCorner";
import { AppLinksBox } from "@/components/HomeComponents/AppLinkBox";
import { BaseActionBox } from "@/components/HomeComponents/BasicActionBox.tsx";
import { CreateNullifierBox } from "@/components/HomeComponents/CreateNullifierBox";
import { CredentialBox } from "@/components/HomeComponents/CredentialBox";
import { MinaSendBox } from "@/components/HomeComponents/SendBox.tsx";
import { SignFieldsBox } from "@/components/HomeComponents/SignFieldsBox.tsx";
import { SignMessageBox } from "@/components/HomeComponents/SignMessageBox.tsx";
import { SignTransactionBox } from "@/components/HomeComponents/SignTransactionBox";
import { SignTypeMessageBox } from "@/components/HomeComponents/SignTypeMessageBox";
import { StakingBox } from "@/components/HomeComponents/StakingBox.tsx";
import { SwitchChainBox } from "@/components/HomeComponents/SwitchChainBox";
import { InfoRow, InfoType } from "@/components/InfoRow.tsx";
import { PageHead } from "@/components/PageHead";
import { VersionBox } from "@/components/VersionBox";
import {
  Container,
  PageContainer,
  StyledPageTitle,
  StyledRowSection,
  StyledRowTitle,
  StyledStatusRowWrapper,
} from "@/styles/HomeStyles.ts";
import { ChainInfoArgs, ProviderError } from "@aurowallet/mina-provider";
import { useCallback, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import StyledComponentsRegistry from "./registry";

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [currentNetwork, setCurrentNetwork] = useState<ChainInfoArgs>({
    networkID: "",
  });

  const onSetCurrentAccount = useCallback((account: string) => {
    setCurrentAccount(account);
  }, []);

  const initNetwork = useCallback(async () => {
    const network: ChainInfoArgs = await (window as any)?.mina
      ?.requestNetwork()
      .catch((err: any) => err);
    if (!network?.networkID) {
      return;
    }
    setCurrentNetwork(network);
  }, []);

  useEffect(() => {
    /** account change listener */
    (window as any)?.mina?.on("accountsChanged", async (accounts: string[]) => {
      console.log("accountsChanged", accounts);
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
      } else {
        console.log("disconnect"); // handled disconnect here
      }
    });
    (window as any)?.mina?.on(
      "chainChanged",
      async (chainInfo: ChainInfoArgs) => {
        console.log("chainChanged");
        if (!chainInfo?.networkID) {
          return;
        }
        setCurrentNetwork(chainInfo);
      }
    );
    initNetwork();
  }, []);

  const initAccount = useCallback(async () => {
    const data: string[] | ProviderError = await (window as any)?.mina
      ?.getAccounts()
      .catch((err: any) => err);
    if (Array.isArray(data) && data.length > 0) {
      setCurrentAccount(data[0]);
    }
  }, []);
  useEffect(() => {
    initAccount();
  }, []);

  return (
    <StyledComponentsRegistry>
      <PageContainer>
        <PageHead />
        <header>
          <StyledPageTitle>AURO E2E Test zkApp</StyledPageTitle>
        </header>
        <GithubCorner />
        <StyledRowSection>
          <StyledRowTitle>Status</StyledRowTitle>
          <Container>
            <StyledStatusRowWrapper>
              <InfoRow
                title="Network: "
                content={currentNetwork.networkID}
                type={InfoType.primary}
              />
              <InfoRow
                title="Accounts: "
                content={currentAccount}
                type={InfoType.success}
              />
            </StyledStatusRowWrapper>
          </Container>
        </StyledRowSection>
        <Container>
          <BaseActionBox
            currentAccount={currentAccount}
            onSetCurrentAccount={onSetCurrentAccount}
          />
          <SwitchChainBox network={currentNetwork} />
        </Container>
        <Container>
          <MinaSendBox />
          <StakingBox />
        </Container>
        <Container>
          <SignTransactionBox
            currentAccount={currentAccount}
            network={currentNetwork}
          />
        </Container>
        <Container>
          <CreateNullifierBox />
          <SignMessageBox currentAccount={currentAccount} />
          <SignTypeMessageBox
            currentAccount={currentAccount}
            network={currentNetwork}
          />
          <SignFieldsBox currentAccount={currentAccount} />
        </Container>

        <Container>
          <CredentialBox currentAccount={currentAccount} />
        </Container>
        <StyledRowTitle>Dev</StyledRowTitle>
        <Container>
          <AppLinksBox />
        </Container>
      </PageContainer>
      <VersionBox />
      <Toaster />
    </StyledComponentsRegistry>
  );
}
