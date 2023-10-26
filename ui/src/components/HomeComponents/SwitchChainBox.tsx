import { NET_CONFIG_TYPE } from "@/constants/config";
import { Box, StyledBoxTitle } from "@/styles/HomeStyles";
import { useCallback, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";

export const SwitchChainBox = ({ network }: { network: string }) => {
  const [switchRes, setSwitchRes] = useState("");
  const onSignType = useCallback(async () => {
    const switchResult = await (window as any)?.mina
      ?.switchChain({
        chainId: NET_CONFIG_TYPE.Devnet,
      })
      .catch((err: any) => err);

    if (switchResult.error) {
      setSwitchRes(switchResult.error?.message);
    } else {
      setSwitchRes(JSON.stringify(switchResult));
    }
  }, []);

  return (
    <Box>
      <StyledBoxTitle>Mina Chain Interactions</StyledBoxTitle>
      <Button onClick={onSignType}>Switch Chain</Button>
      <InfoRow
        title="Switch Chain result: "
        content={switchRes}
        type={InfoType.secondary}
      />
    </Box>
  );
};
