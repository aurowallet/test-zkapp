import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { getErrorMessage, hasErrorMessage } from "@/utils";
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
    if (!provider) {
      setAccountsMsg("Auro Wallet not detected");
      return;
    }
    const data: string[] | ProviderError = await provider
      .requestAccounts()
      .catch((err: any) => err);
    if (hasErrorMessage(data)) {
      setAccountsMsg(getErrorMessage(data));
    } else if (Array.isArray(data) && data.length > 0) {
      let account = (data as string[])[0];
      onSetCurrentAccount(account);
      setAccounts(account);
      setAccountsMsg("");
    } else {
      setAccountsMsg("Failed to connect wallet");
    }
  }, [onSetCurrentAccount, provider]);

  const onGetAccount = useCallback(async () => {
    if (!provider) {
      setNoWindowAccount("");
      return;
    }
    let data = await provider.getAccounts();
    setNoWindowAccount(data?.toString() || "");
    if (Array.isArray(data) && data.length > 0) {
      onSetCurrentAccount(data[0]);
    }
  }, [onSetCurrentAccount, provider]);

  const onGetWalletInfo = useCallback(async () => {
    if (!provider) {
      setWalletInfo("");
      return;
    }
    let data = await provider.getWalletInfo();
    setWalletInfo(JSON.stringify(data));
  }, [provider]);

  const onRevokePermissions = useCallback(async () => {
    if (!provider) {
      setAccountsMsg("Auro Wallet not detected");
      return;
    }
    const supportMethod = Object.getOwnPropertyNames(
      Object.getPrototypeOf(provider)
    ).includes("revokePermissions");
    if (!supportMethod) {
      setAccountsMsg("Revoke permissions not support");
      return;
    }
    await provider.revokePermissions();
    setAccounts("");
    setNoWindowAccount("");
    setAccountsMsg("Revoke permissions success");
    setBtnTxt("connect");
    setBtnStatus(false);
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
      <Button onClick={onGetAccount}>Get account without pop-winow</Button>
      <InfoRow
        title="without pop-winow Account: "
        content={noWindowAccount}
        type={InfoType.secondary}
      />
      <Button onClick={onRevokePermissions}>Revoke account permission</Button>
      <StyledDividedLine />

      <Button onClick={onGetWalletInfo}>Get wallet base info</Button>
      <InfoRow
        title="wallet base info: "
        content={walletInfo}
        type={InfoType.secondary}
      />
    </Box>
  );
};
