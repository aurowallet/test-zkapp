import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { useCallback, useMemo, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";
import { SendTransactionResult, ProviderError } from "@aurowallet/mina-provider";

export const StakingBox = () => {
  const [vaildatorAddress, setVaildatorAddress] = useState("");
  const [fee, setFee] = useState("");
  const [memo, setMemo] = useState("");
  const [resHash, setResHash] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const onChangeVaildator = useCallback((e: any) => {
    setVaildatorAddress(e.target.value);
  }, []);
  const onChangeFee = useCallback((e: any) => {
    setFee(e.target.value);
  }, []);
  const onChangeMemo = useCallback((e: any) => {
    setMemo(e.target.value);
  }, []);
  const onClickStaking = useCallback(async () => {
    setResHash("");
    setErrMsg("");
    let data: SendTransactionResult|ProviderError = await (window as any)?.mina
      ?.sendStakeDelegation({
        to: vaildatorAddress,
        fee: fee,
        memo: memo,
      })
      .catch((err: any) => err);

    if ((data as SendTransactionResult).hash) {
      setResHash((data as SendTransactionResult).hash);
    } else {
      setErrMsg((data as ProviderError).message || "");
    }
  }, [vaildatorAddress, fee, memo]);

  return (
    <Box>
      <StyledBoxTitle>Mina Staking</StyledBoxTitle>
      <Input placeholder="Set vaildator address" onChange={onChangeVaildator} />
      <Input placeholder="Set Fee (Option)" onChange={onChangeFee} />
      <Input placeholder="Set memo (Option)" onChange={onChangeMemo} />
      <StyledDividedLine />
      <Button onClick={onClickStaking}>Staking</Button>
      <InfoRow
        title="Staking Result: "
        content={resHash||errMsg}
        type={InfoType.secondary}
      />
    </Box>
  );
};
