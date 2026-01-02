import { useMinaProvider } from "@/context/MinaProviderContext";
import { useTranslation } from "@/context/LanguageContext";
import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import {
  ProviderError,
  SendTransactionResult,
} from "@aurowallet/mina-provider";
import { useCallback, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";

export const MinaSendBox = () => {
  const { provider } = useMinaProvider();
  const { t } = useTranslation();

  const [receiveAddress, setReceiveAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("");
  const [memo, setMemo] = useState("");
  const [nonce, setNonce] = useState("");
  const [resHash, setResHash] = useState("");
  const [errMsg, setErrMsg] = useState("");

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
  const onChangeNonce = useCallback((e: any) => {
    setNonce(e.target.value);
  }, []);
  const onClickSend = useCallback(async () => {
    setResHash("");
    setErrMsg("");
    let params = {
      amount: parseFloat(amount),
      to: receiveAddress,
      fee: parseFloat(fee),
      memo: memo,
      nonce: parseInt(nonce),
    };

    let data: SendTransactionResult | ProviderError = await provider
      ?.sendPayment(params)
      .catch((err: any) => err);

    if ((data as SendTransactionResult).hash) {
      setResHash(JSON.stringify(data));
    } else {
      setErrMsg((data as ProviderError).message || "");
    }
  }, [receiveAddress, amount, fee, memo, nonce, provider]);

  return (
    <Box>
      <StyledBoxTitle>Mina Send</StyledBoxTitle>
      <Input placeholder={t.minaSend.receiveAddress} onChange={onChangeReceive} />
      <Input placeholder={t.minaSend.sendAmount} onChange={onChangeAmount} />
      <Input placeholder={t.minaSend.fee} onChange={onChangeFee} />
      <Input placeholder={t.minaSend.memo} onChange={onChangeMemo} />
      <Input placeholder={t.minaSend.nonce} onChange={onChangeNonce} />
      <StyledDividedLine />
      <Button checkConnection={true} onClick={onClickSend}>
        {t.common.send}
      </Button>
      <InfoRow
        title={`${t.minaSend.sendResult}: `}
        content={resHash || errMsg}
        type={InfoType.secondary}
      />
    </Box>
  );
};
