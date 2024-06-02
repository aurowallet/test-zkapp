import { DefaultSupportNetorkIDs } from "@/constants/config";
import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { useCallback, useMemo, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";
import { ChainInfoArgs, ProviderError } from "@aurowallet/mina-provider";

export const SwitchChainBox = ({ network }: { network: ChainInfoArgs }) => {
  const [switchRes, setSwitchRes] = useState("");
  const [networkID, setNetworkID] = useState("");
  const [graphQLUrl, setGraphQLUrl] = useState("")
  const [networkName, setNetworkName] = useState("")
  const [addRes, setAddRes] = useState("");

  const onChangeNetworkID = useCallback((e: any) => {
    setNetworkID(e.target.value);
  }, []);


  const onChangeGraphQLUrl = useCallback((e: any) => {
    setGraphQLUrl(e.target.value);
  }, []);

  const onChangeNetworkName = useCallback((e: any) => {
    setNetworkName(e.target.value);
  }, []);
  
  
  const onSwitch = useCallback(async () => {
    const switchResult:ChainInfoArgs|ProviderError = await (window as any)?.mina
      ?.switchChain({
        networkID: networkID.trim(),
      })
      .catch((err: any) => err);
      console.log('onSwitch==0,',switchResult);
    if ((switchResult as ProviderError).message) {
      setSwitchRes((switchResult as ProviderError).message);
    } else {
      setSwitchRes(JSON.stringify(switchResult));
    }
  }, [networkID]);
  const supportChainList:string[] = useMemo(() => {
    return Object.values(DefaultSupportNetorkIDs);
  }, []);


  const onAdd =  useCallback(async () => {
    const addInfo = {
      url: encodeURIComponent(graphQLUrl),
      name: networkName,
    }
    const addResult:ChainInfoArgs|ProviderError = await (window as any)?.mina
      ?.addChain(addInfo)
      .catch((err: any) => err);
      console.log('addResult==0,',addResult);
    if ((addResult as ProviderError).message) {
      setAddRes((addResult as ProviderError).message);
    } else {
      setAddRes(JSON.stringify(addResult));
    }
  }, [graphQLUrl,networkName]);

  return (
    <Box>
      <StyledBoxTitle>
        Mina Chain Interactions{"(" + network.networkID + ")"}
      </StyledBoxTitle>
      <Input placeholder="Input GraphQL Url" onChange={onChangeGraphQLUrl} />
      <Input placeholder="Input Network Name" onChange={onChangeNetworkName} />
      <Button onClick={onAdd}>Add Chain</Button>
      <InfoRow
        title="Add Chain result: "
        content={addRes}
        type={InfoType.secondary}
      />
      <StyledDividedLine />

      <Input placeholder="Input NetworkId" onChange={onChangeNetworkID} />
      <InfoRow title="Current Support NetworkID: " type={InfoType.success}>
        {
          supportChainList.map((supportChain)=>{
            return supportChain + " , "
          })
        }
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
