import { NET_CONFIG_TYPE } from "@/constants/config";
import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { useCallback, useMemo, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";
import { ChainInfoArgs } from "@aurowallet/mina-provider";
import { formatNetwork } from "@/utils";

export const SwitchChainBox = ({ network }: { network: ChainInfoArgs }) => {
  const [switchRes, setSwitchRes] = useState("");
  const [chainType, setChainType] = useState("");
  const [graphQLUrl, setGraphQLUrl] = useState("")
  const [networkName, setNetworkName] = useState("")
  const [addRes, setAddRes] = useState("");

  const onChangeChainType = useCallback((e: any) => {
    setChainType(e.target.value);
  }, []);


  const onChangeGraphQLUrl = useCallback((e: any) => {
    setGraphQLUrl(e.target.value);
  }, []);

  const onChangeNetworkName = useCallback((e: any) => {
    setNetworkName(e.target.value);
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


  const onAdd =  useCallback(async () => {
    const addInfo = {
      url: encodeURIComponent(graphQLUrl),
      name: networkName,
    }
    const addResult = await (window as any)?.mina
      ?.addChain(addInfo)
      .catch((err: any) => err);
      
    if (addResult.message) {
      setAddRes(addResult.message);
    } else {
      setAddRes(JSON.stringify(addResult));
    }
  }, [graphQLUrl,networkName]);

  return (
    <Box>
      <StyledBoxTitle>
        Mina Chain Interactions{"(" + formatNetwork(network) + ")"}
      </StyledBoxTitle>
      {/* 添加网络 */}
      <Input placeholder="Input GraphQL Url" onChange={onChangeGraphQLUrl} />
      <Input placeholder="Input Network Name" onChange={onChangeNetworkName} />
      <Button onClick={onAdd}>Add Chain</Button>
      <InfoRow
        title="Add Chain result: "
        content={addRes}
        type={InfoType.secondary}
      />
      <StyledDividedLine />

      <Input placeholder="Input Chain Type" onChange={onChangeChainType} />
      <InfoRow title="Current Support Chain Id: " type={InfoType.success}>
        {supportChain}
      </InfoRow>
      <Button onClick={onSwitch}>Switch Chain</Button>
      <InfoRow
        title="Switch Chain result: "
        content={switchRes}
        type={InfoType.secondary}
      />
    </Box>
  );
};
