import { Box, StyledBoxTitle } from "@/styles/HomeStyles";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { useCallback, useEffect, useState } from "react";
import { ProviderError } from "@aurowallet/mina-provider";
import { useMinaProvider } from "@/context/MinaProviderContext";

export const BaseActionBox = ({
  currentAccount,
  onSetCurrentAccount,
}: {
  currentAccount: string;
  onSetCurrentAccount: (account: string) => void;
}) => {
  const { provider } = useMinaProvider();

  const [accounts, setAccounts] = useState(currentAccount);
  const [accountsMsg, setAccountsMsg] = useState("");
  const [btnTxt, setBtnTxt] = useState("connect");
  const [btnStatus, setBtnStatus] = useState(!currentAccount);
  const [noWindowAccount, setNoWindowAccount] = useState("");
  const [walletInfo, setWalletInfo] = useState("");
  useEffect(() => {
    if (currentAccount) {
      setBtnTxt("Connected");
      setBtnStatus(true);
    } else {
      setBtnTxt("connect");
      setBtnStatus(false);
    }
    setAccounts(currentAccount);
  }, [currentAccount]);
  const onClickConnect = useCallback(async () => {
    const data: string[] | ProviderError = await provider
      ?.requestAccounts()
      .catch((err: any) => err);
    if ((data as ProviderError).message) {
      setAccountsMsg((data as ProviderError).message);
    } else {
      let account = (data as string[])[0];
      onSetCurrentAccount(account);
      setAccounts(account);
      setAccountsMsg("");
    }
  }, [onSetCurrentAccount, provider]);

  const onGetAccount = useCallback(async () => {
    let data = await provider?.getAccounts();
    setNoWindowAccount(data?.toString() || "");
    if (Array.isArray(data) && data.length > 0) {
      onSetCurrentAccount(data[0]);
    }
  }, [onSetCurrentAccount, provider]);

  const onGetWalletInfo = useCallback(async () => {
    let data = await provider?.getWalletInfo();
    setWalletInfo(JSON.stringify(data));
  }, [provider]);

  return (
    <Box>
      <StyledBoxTitle>Basic Actions</StyledBoxTitle>
      <Button disabled={btnStatus} onClick={onClickConnect}>
        {btnTxt}
      </Button>
      <InfoRow
        title="Get Account result: "
        content={accountsMsg || accounts}
        type={InfoType.secondary}
      />
      <Button onClick={onGetAccount}>Get Account without pop-winow</Button>
      <InfoRow
        title="without pop-winow Account: "
        content={noWindowAccount}
        type={InfoType.secondary}
      />

      <Button onClick={onGetWalletInfo}>Get wallet base info</Button>
      <InfoRow
        title="wallet base info: "
        content={walletInfo}
        type={InfoType.secondary}
      />
    </Box>
  );
};
