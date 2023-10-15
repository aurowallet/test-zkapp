import { BaseActionBox } from "@/components/HomeComponents/BasicActionBox.tsx";
import { MinaSendBox } from "@/components/HomeComponents/SendBox.tsx";
import { SignFieldsBox } from "@/components/HomeComponents/SignFieldsBox.tsx";
import { SignMessageBox } from "@/components/HomeComponents/SignMessageBox.tsx";
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
import { devices } from "@/styles/common";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [currentNetwork, setCurrentNetwork] = useState("");

  useEffect(() => {
    (async () => {
      const { Mina, PublicKey } = await import("o1js");
      const { Add } = await import("../../../contracts/build/src/");

      // Update this to use the address (public key) for your zkApp account.
      // To try it out, you can try this address for an example "Add" smart contract that we've deployed to
      // Berkeley Testnet B62qkwohsqTBPsvhYE8cPZSpzJMgoKn4i1LQRuBAtVXWpaT4dgH6WoA.
      const zkAppAddress = "";
      // This should be removed once the zkAppAddress is updated.
      if (!zkAppAddress) {
        console.error(
          'The following error is caused because the zkAppAddress has an empty string as the public key. Update the zkAppAddress with the public key for your zkApp account, or try this address for an example "Add" smart contract that we deployed to Berkeley Testnet: B62qkwohsqTBPsvhYE8cPZSpzJMgoKn4i1LQRuBAtVXWpaT4dgH6WoA'
        );
      }
      //const zkApp = new Add(PublicKey.fromBase58(zkAppAddress))
    })();
  }, []);

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
        <BaseActionBox currentAccount={currentAccount} />
        <MinaSendBox network={currentNetwork} />
        <StakingBox network={currentNetwork} />
        <SignMessageBox currentAccount={currentAccount} />
        <SignFieldsBox currentAccount={currentAccount} />
      </Container>
    </PageContainer>
  );
}
