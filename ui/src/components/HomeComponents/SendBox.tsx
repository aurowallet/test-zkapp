import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { EXPLORER_URL } from "@/constants/config";
import { useCallback, useMemo, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";

type ISendResult = {
  hash?: string;
  message?: string;
};
export const MinaSendBox = ({ network }: { network: string }) => {
  const [receiveAddress, setReceiveAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("");
  const [memo, setMemo] = useState("");
  const [resHash, setResHash] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const explorerLink = useMemo(() => {
    const url = EXPLORER_URL[network];
    if (url) {
      return url + "/tx/";
    }
    return "";
  }, [network]);

  const onChangeReceive = useCallback((e: any) => {
    setReceiveAddress(e.target.value);
  }, []);
  const onChangeAmount = useCallback((e: any) => {
    setAmount(e.target.value);
  }, []);
  const onChangeFee = useCallback((e: any) => {
    setFee(e.target.value);
  }, []);
  const onChangeMemo = useCallback((e: any) => {
    setMemo(e.target.value);
  }, []);
  const onClickSend = useCallback(async () => {
    setResHash("");
    setErrMsg("");
    let data:ISendResult = await (window as any)?.mina
      ?.sendLegacyPayment({
        amount: amount,
        to: receiveAddress,
        fee: fee,
        memo: memo,
      })
      .catch((err: any) => err);

    if (data.hash) {
      setResHash(data.hash);
    } else {
      setErrMsg(data.message||"");
    }
  }, [receiveAddress, amount, fee, memo]);

  return (
    <Box>
      <StyledBoxTitle>Mina Send</StyledBoxTitle>
      <Input placeholder="Set receive address" onChange={onChangeReceive} />
      <Input placeholder="Set send amount" onChange={onChangeAmount} />
      <Input placeholder="Set Fee (Option)" onChange={onChangeFee} />
      <Input placeholder="Set memo (Option)" onChange={onChangeMemo} />
      <StyledDividedLine />
      <Button onClick={onClickSend}>Send</Button>
      <InfoRow
        title="Send Result: "
        linkHref={resHash ? explorerLink + resHash : ""}
        linkContent={resHash}
        content={errMsg}
        type={InfoType.secondary}
      />
    </Box>
  );
};
