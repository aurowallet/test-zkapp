import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { useCallback, useState } from "react";
import styled from "styled-components";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";

export const TokenBox = ({ currentAccount }: { currentAccount: string }) => {
  const [createBtnStatus, setCreateBtnStatus] = useState(false);
  const [createTokenRes, setCreateTokenRes] = useState({
    status: false,
    text: "",
  });
  const [sendTokenRes, setSendTokenRes] = useState({
    status: false,
    text: "",
  });
  const [sendAmount, setSendAmount] = useState(0);
  const [receiveAddress, setReceiveAddress] = useState("");

  const onChangeAmount = useCallback((e: any) => {
    setSendAmount(e.target.value);
  }, []);

  const onChangeReceiveAddress = useCallback((e: any) => {
    setReceiveAddress(e.target.value);
  }, []);

  const onClickToken = useCallback(async () => {}, []);

  const onCheckToken = useCallback(async () => {}, []);
  const onSendToken = useCallback(async () => {}, [sendAmount, receiveAddress]);
  return (
    <Box>
      <StyledBoxTitle>Mina Token</StyledBoxTitle>
      <Button onClick={onClickToken}>Create Token</Button>
      <InfoRow
        title={"Create Token Result: "}
        content={createTokenRes.text}
        type={InfoType.secondary}
      />
      <Button disabled={createBtnStatus} onClick={onCheckToken}>
        Check Token Status
      </Button>
      <StyledDividedLine />
      <Input
        placeholder="Set Receive Address"
        onChange={onChangeReceiveAddress}
      />
      <Input placeholder="Set Amount" onChange={onChangeAmount} />
      <Button disabled={createBtnStatus} onClick={onSendToken}>
        {"Send Token"}
      </Button>
      <InfoRow
        title={"Send Token State: "}
        content={sendTokenRes.text}
        type={InfoType.secondary}
      />
    </Box>
  );
};
