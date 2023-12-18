'use client';

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
import { formatNetwork } from "@/utils";
import { ChainInfoArgs, ProviderError } from "@aurowallet/mina-provider";
import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import StyledComponentsRegistry from "./registry";
import { VersionBox } from "@/components/VersionBox";
import { TokenBox } from "@/components/HomeComponents/TokenBox";

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [currentNetwork, setCurrentNetwork] = useState<ChainInfoArgs>({
    chainId: "",
    name: ""
  });

  const initNetwork = useCallback(async () => {
    const network: ChainInfoArgs = await (window as any)?.mina
      ?.requestNetwork()
      .catch((err: any) => err);
    setCurrentNetwork(network);
  }, []);

  useEffect(() => {
    /** account change listener */
    (window as any)?.mina?.on("accountsChanged", async (accounts: string[]) => {
      console.log("accountsChanged", accounts);
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
      }else{
        console.log('disconnect');// handled disconnect here
      }
    });
    (window as any)?.mina?.on("chainChanged", async (chainInfo: ChainInfoArgs) => {
      console.log("chainChanged");
      setCurrentNetwork(chainInfo);
    });
    initNetwork();
  }, []);

  const initAccount = useCallback(async () => {
    const data:string[]|ProviderError = await (window as any)?.mina
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
      <Head>
        <link rel="shortcut icon" href="/imgs/auro.png" />
        <title>AURO E2E Test zkApp</title>
        <meta
          name="robots"
          content="max-snippet:-1,max-image-preview:standard,max-video-preview:-1"
        />
        <meta
          name="description"
          content="Available as a browser extension and as a mobile app, Auro Wallet perfectly supports Mina Protocol. easily send, receive or stake your MINA anytime."
        />
        <meta
          property="og:image"
          content="%PUBLIC_URL%/imgs/og_priview.png"
          data-rh="true"
        />
        <meta property="og:locale" content="en_US" />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Auro Wallet - Mina Protocol Wallet"
          data-rh="true"
        />
        <meta
          property="og:description"
          content="Available as a browser extension and as a mobile app, Auro Wallet perfectly supports Mina Protocol. easily send, receive or stake your MINA anytime."
        />
        {/* <meta property="og:url" content="https://www.aurowallet.com/" /> */}
        <meta property="og:site_name" content="Auro Wallet" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Auro Wallet - Mina Protocol Wallet"
          data-rh="true"
        />
        <meta
          name="twitter:description"
          content="Available as a browser extension and as a mobile app, Auro Wallet perfectly supports Mina Protocol. easily send, receive or stake your MINA anytime."
        />
        <meta
          name="twitter:image"
          content="%PUBLIC_URL%/imgs/og_priview.png"
          data-rh="true"
        />
      </Head>
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
              content={formatNetwork(currentNetwork)}
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
        <BaseActionBox currentAccount={currentAccount} />
        <SwitchChainBox network={currentNetwork} />
      </Container>
      <Container>
        <MinaSendBox />
        <StakingBox />
      </Container>
      <Container>
        <SignTransactionBox currentAccount={currentAccount} />
        <TokenBox currentAccount={currentAccount} />
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
    </PageContainer>
    <VersionBox/>
    </StyledComponentsRegistry>
  );
}
