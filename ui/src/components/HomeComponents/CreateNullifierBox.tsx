import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { useCallback, useMemo, useState } from "react";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";

export const CreateNullifierBox = () => {
  const [signFields, setSignFields] = useState("");
  const [createRes, setCreateRes] = useState("");

  const onChangeMessageContent = useCallback((e: any) => {
    setSignFields(e.target.value);
  }, []);

  const onCreate = useCallback(async () => {
    let signContent = "";
    try {
      signContent = JSON.parse(signFields);
      const signResult: any = await (window as any)?.mina
        .createNullifier({
          message: signContent,
        })
        .catch((err: any) => err);

      if (signResult.private) {
        setCreateRes(signResult);
      } else {
        setCreateRes(signResult.message || "");
      }
    } catch (error) {
      console.error(error);
    }
  }, [signFields]);
  const nullifierContent = useMemo(()=>{
    let content = ""
    if(createRes){
      content = JSON.stringify(createRes, null, 2)
    }
    return content
  },[createRes])

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
