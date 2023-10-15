import { EXPLORER_URL } from "@/constants/config";
import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { useCallback, useMemo, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";

type IStakingResult = {
  hash?: string;
  message?: string;
};
export const StakingBox = ({ network }: { network: string }) => {
  const [vaildatorAddress, setVaildatorAddress] = useState("");
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
    let data: IStakingResult = await (window as any)?.mina
      ?.sendLegacyStakeDelegation({
        to: vaildatorAddress,
        fee: fee,
        memo: memo,
      })
      .catch((err: any) => err);

    if (data.hash) {
      setResHash(data.hash);
    } else {
      setErrMsg(data.message || "");
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
        linkHref={resHash ? explorerLink + resHash : ""}
        linkContent={resHash}
        content={errMsg}
        type={InfoType.secondary}
      />
    </Box>
  );
};
