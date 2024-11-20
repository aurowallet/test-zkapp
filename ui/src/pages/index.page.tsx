"use client";

import { GithubCorner } from "@/components/GithubCorner";
import { BaseActionBox } from "@/components/HomeComponents/BasicActionBox.tsx";
import { CreateNullifierBox } from "@/components/HomeComponents/CreateNullifierBox";
import { MinaSendBox } from "@/components/HomeComponents/SendBox.tsx";
import { SignFieldsBox } from "@/components/HomeComponents/SignFieldsBox.tsx";
import { SignMessageBox } from "@/components/HomeComponents/SignMessageBox.tsx";
import { SignTransactionBox } from "@/components/HomeComponents/SignTransactionBox";
import { SignTypeMessageBox } from "@/components/HomeComponents/SignTypeMessageBox";
import { StakingBox } from "@/components/HomeComponents/StakingBox.tsx";
import { SwitchChainBox } from "@/components/HomeComponents/SwitchChainBox";
import { InfoRow, InfoType } from "@/components/InfoRow.tsx";
import {
  Container,
  PageContainer,
  StyledPageTitle,
  StyledRowSection,
  StyledRowTitle,
  StyledStatusRowWrapper,
} from "@/styles/HomeStyles.ts";
import { ChainInfoArgs, ProviderError } from "@aurowallet/mina-provider";
import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import StyledComponentsRegistry from "./registry";
import { VersionBox } from "@/components/VersionBox";
import { AppLinksBox } from "@/components/HomeComponents/AppLinkBox";
import { PageHead } from "@/components/PageHead";

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
    console.log("initNetwork==0", JSON.stringify(network));
    console.log("initNetwork==1", (window as any)?.mina);
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
        console.log("chainChanged==", JSON.stringify(chainInfo));
        console.log("chainChanged");
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
        <PageHead/>
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
        <StyledRowTitle>Dev</StyledRowTitle>
        <Container>
          <AppLinksBox />
        </Container>
      </PageContainer>
      <VersionBox />
    </StyledComponentsRegistry>
  );
}
