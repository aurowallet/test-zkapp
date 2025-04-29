import { useMinaProvider } from "@/context/MinaProviderContext";
import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import {
  Nullifier,
  ProviderError
} from "@aurowallet/mina-provider";
import { useCallback, useMemo, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";

export const CreateNullifierBox = () => {
  const { provider } = useMinaProvider();

  const [signFields, setSignFields] = useState("");
  const [createRes, setCreateRes] = useState<
    Nullifier | ProviderError | string
  >();

  const onChangeMessageContent = useCallback((e: any) => {
    setSignFields(e.target.value);
  }, []);

  const onCreate = useCallback(async () => {
    try {
      let parseSignContent = JSON.parse(signFields);
      const signResult: Nullifier | ProviderError = await provider
        ?.createNullifier({
          message: parseSignContent,
        })
        .catch((err: any) => err);

      if ((signResult as Nullifier).private) {
        setCreateRes(signResult);
      } else {
        setCreateRes((signResult as ProviderError).message || "");
      }
    } catch (error) {
      console.warn(error);
    }
  }, [signFields, provider]);
  const nullifierContent = useMemo(() => {
    let content = "";
    if (createRes) {
      content = JSON.stringify(createRes, null, 2);
    }
    return content;
  }, [createRes]);

  return (
    <Box>
      <StyledBoxTitle>Mina Create Nullifier</StyledBoxTitle>
      <Input
        placeholder="Set message (eg: ['1','2','3',...])"
        onChange={onChangeMessageContent}
      />
      <Button onClick={onCreate}>Create</Button>
      <InfoRow title="Create result: " type={InfoType.secondary}>
        {nullifierContent && <div>{nullifierContent}</div>}
      </InfoRow>

      <StyledDividedLine />
    </Box>
  );
};
