import { Box, StyledBoxTitle } from "@/styles/HomeStyles";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { useCallback, useEffect, useState } from "react";

export const BaseActionBox = ({
  currentAccount,
}: {
  currentAccount: string;
}) => {
  const [accounts, setAccounts] = useState(currentAccount);
  const [accountsMsg, setAccountsMsg] = useState("");
  const [btnTxt, setBtnTxt] = useState("connect");
  const [btnStatus, setBtnStatus] = useState(!currentAccount);
  const [noWindowAccount, setNoWindowAccount] = useState("");
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
    const data = await (window as any)?.mina
      .requestAccounts()
      .catch((err: any) => err);
    if (data.message) {
      setAccountsMsg(data.message);
    } else {
      setAccounts(data[0]);
      setAccountsMsg("");
    }
  }, []);

  const onGetAccount = useCallback(async () => {
    let data = await (window as any)?.mina?.getAccounts();
    setNoWindowAccount(data);
  }, []);

  return (
    <Box>
      <StyledBoxTitle>Basic Actions</StyledBoxTitle>
      <Button disabled={btnStatus} onClick={onClickConnect}>
        {btnTxt}
      </Button>
      <InfoRow
        title="Get Account result: "
        content={accountsMsg||accounts}
        type={InfoType.secondary}
      />
      <Button onClick={onGetAccount}>Get Account without pop-winow</Button>
      <InfoRow
        title="without pop-winow Account: "
        content={noWindowAccount}
        type={InfoType.secondary}
      />
    </Box>
  );
};
