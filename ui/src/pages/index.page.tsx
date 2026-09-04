"use client";

import { GithubCorner } from "@/components/GithubCorner";
import { AppLinksBox } from "@/components/HomeComponents/AppLinkBox";
import { BaseActionBox } from "@/components/HomeComponents/BasicActionBox.tsx";
import { CreateNullifierBox } from "@/components/HomeComponents/CreateNullifierBox";
import { MinaSendBox } from "@/components/HomeComponents/SendBox.tsx";
import { SignFieldsBox } from "@/components/HomeComponents/SignFieldsBox.tsx";
import { SignMessageBox } from "@/components/HomeComponents/SignMessageBox.tsx";
import { SignTypeMessageBox } from "@/components/HomeComponents/SignTypeMessageBox";
import { StakingBox } from "@/components/HomeComponents/StakingBox.tsx";
import { SwitchChainBox } from "@/components/HomeComponents/SwitchChainBox";
import { InfoRow, InfoType } from "@/components/InfoRow.tsx";
import { PageHead } from "@/components/PageHead";
import { VersionBox } from "@/components/VersionBox";
import { MesaSignTransactionBox } from "@/components/HomeComponents/MesaSignTransactionBox";
import dynamic from "next/dynamic";
import { useMinaProvider } from "@/context/MinaProviderContext";
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

const CredentialBox = dynamic(
  () => import("@/components/HomeComponents/CredentialBox").then((module) => module.CredentialBox),
  { ssr: false }
);

export function HomePage() {
  const { provider } = useMinaProvider();

  const [currentAccount, setCurrentAccount] = useState("");
  const [currentNetwork, setCurrentNetwork] = useState<ChainInfoArgs>({
    networkID: "",
  });

  const onSetCurrentAccount = useCallback((account: string) => {
    setCurrentAccount(account);
  }, []);

  const initNetwork = useCallback(async () => {
    if (!provider) {
      return;
    }
    const network: ChainInfoArgs = await provider
      .requestNetwork()
      .catch((err: any) => err);
    if (!network?.networkID) {
      return;
    }
    setCurrentNetwork(network);
  }, [provider]);

  useEffect(() => {
    /** account change listener */
    provider?.on("accountsChanged", async (accounts: string[]) => {
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
      }
    });
    provider?.on("chainChanged", async (chainInfo: ChainInfoArgs) => {
      if (!chainInfo?.networkID) {
        return;
      }
      setCurrentNetwork(chainInfo);
    });
    initNetwork();
  }, [provider]);

  const initAccount = useCallback(async () => {
    if (!provider) {
      return;
    }
    const data: string[] | ProviderError = await provider
      .getAccounts()
      .catch((err: any) => err);
    if (Array.isArray(data) && data.length > 0) {
      setCurrentAccount(data[0]);
    }
  }, [provider]);
  useEffect(() => {
    initAccount();
  }, [provider]);

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
          <MesaSignTransactionBox
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

export default function Home() {
  return <HomePage />;
}
