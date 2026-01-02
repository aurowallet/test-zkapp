import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { useCallback, useEffect, useState } from "react";
import { ProviderError } from "@aurowallet/mina-provider";
import { useMinaProvider } from "@/context/MinaProviderContext";
import { useTranslation } from "@/context/LanguageContext";

export const BaseActionBox = ({
  currentAccount,
  onSetCurrentAccount,
}: {
  currentAccount: string;
  onSetCurrentAccount: (account: string) => void;
}) => {
  const { provider } = useMinaProvider();
  const { t } = useTranslation();

  const [accounts, setAccounts] = useState(currentAccount);
  const [accountsMsg, setAccountsMsg] = useState("");
  const [btnTxt, setBtnTxt] = useState(t.common.connect);
  const [btnStatus, setBtnStatus] = useState(!currentAccount);
  const [noWindowAccount, setNoWindowAccount] = useState("");
  const [walletInfo, setWalletInfo] = useState("");
  useEffect(() => {
    if (currentAccount) {
      setBtnTxt(t.common.connected);
      setBtnStatus(true);
    } else {
      setBtnTxt(t.common.connect);
      setBtnStatus(false);
    }
    setAccounts(currentAccount);
  }, [currentAccount, t]);
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

  const onRevokePermissions = useCallback(async () => {
    const supportMethod = Object.getOwnPropertyNames(
      Object.getPrototypeOf(provider)
    ).includes("revokePermissions");
    if (!supportMethod) {
      setAccountsMsg(t.basicActions.revokeNotSupport);
      return;
    }
    await provider?.revokePermissions();
    setAccounts("");
    setNoWindowAccount("");
    setAccountsMsg(t.basicActions.revokeSuccess);
    setBtnTxt(t.common.connect);
    setBtnStatus(false);
  }, [provider, t]);

  return (
    <Box>
      <StyledBoxTitle>Basic Actions</StyledBoxTitle>
      <Button disabled={btnStatus} onClick={onClickConnect}>
        {btnTxt}
      </Button>
      <InfoRow
        title={`${t.basicActions.getAccountResult}: `}
        content={accountsMsg || accounts}
        type={InfoType.secondary}
      />
      <Button onClick={onGetAccount}>{t.basicActions.getAccountWithoutPopup}</Button>
      <InfoRow
        title={`${t.basicActions.withoutPopupAccount}: `}
        content={noWindowAccount}
        type={InfoType.secondary}
      />
      <Button onClick={onRevokePermissions}>{t.basicActions.revokePermission}</Button>
      <StyledDividedLine />

      <Button onClick={onGetWalletInfo}>{t.basicActions.getWalletInfo}</Button>
      <InfoRow
        title={`${t.basicActions.walletBaseInfo}: `}
        content={walletInfo}
        type={InfoType.secondary}
      />
    </Box>
  );
};
