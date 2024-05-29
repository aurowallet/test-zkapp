import { Box } from "@/styles/HomeStyles";
import { useCallback, useState } from "react";
import styled from "styled-components";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";

export const StatusCheck = ({}: {}) => {
  const [checkStatus, setCheckStatus] = useState("");

  const onClickCreateKey = useCallback(async () => {
    setCheckStatus(String(self.crossOriginIsolated));
  }, []);

  return (
    <Box>
      <Button checkInstall={false} onClick={onClickCreateKey}>
        check status
      </Button>
      <InfoRow title={"Support Status"} type={InfoType.secondary}>
        <div>{checkStatus}</div>
      </InfoRow>
    </Box>
  );
};
