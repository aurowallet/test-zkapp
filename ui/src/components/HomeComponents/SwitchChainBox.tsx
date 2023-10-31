import { NET_CONFIG_TYPE } from "@/constants/config";
import { Box, StyledBoxTitle } from "@/styles/HomeStyles";
import { useCallback, useMemo, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";

export const SwitchChainBox = ({ network }: { network: string }) => {
  const [switchRes, setSwitchRes] = useState("");
  const [chainType, setChainType] = useState("");

  const onChangeChainType = useCallback((e: any) => {
    setChainType(e.target.value);
  }, []);
  const onSwitch = useCallback(async () => {
    const switchResult = await (window as any)?.mina
      ?.switchChain({
        chainId: chainType.trim(),
      })
      .catch((err: any) => err);
    if (switchResult.message) {
      setSwitchRes(switchResult.message);
    } else {
      setSwitchRes(JSON.stringify(switchResult));
    }
  }, [chainType]);
  const supportChain = useMemo(() => {
    let list: Array<string> = [];
    Object.keys(NET_CONFIG_TYPE).map((key: string) => {
      list.push(NET_CONFIG_TYPE[key]);
    });
    const showValue = JSON.stringify(list, null, 2);
    return showValue;
  }, []);

  return (
    <Box>
      <StyledBoxTitle>
        Mina Chain Interactions{"(" + network + ")"}
      </StyledBoxTitle>
      <Input placeholder="Input Chain Type" onChange={onChangeChainType} />
      <InfoRow title="Current Support Chain Type: " type={InfoType.success}>
        {supportChain}
      </InfoRow>
      <Button onClick={onSwitch}>Switch Chain</Button>
      {/* 给选项，或者输入 */}

      <InfoRow
        title="Switch Chain result: "
        content={switchRes}
        type={InfoType.secondary}
      />
    </Box>
  );
};
