import { Button } from "@/components/Button.tsx";
import { InfoRow, InfoType } from "@/components/InfoRow.tsx";
import { Input } from "@/components/Input.tsx";
import { Box, Container, PageContainer } from "@/styles/HomeStyles.ts";
import { useEffect, useState } from "react";

export default function Home() {
  const [network, setNetwork] = useState("");
  const [accounts, setAccounts] = useState("");
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

  return (
    <PageContainer>
      <Container>
        <Box>
          <Input placeholder="Set send amount" />
          <Button>onClick</Button>
          <InfoRow title="info row" type={InfoType.primary} />
        </Box>
      </Container>
    </PageContainer>
  );
}
