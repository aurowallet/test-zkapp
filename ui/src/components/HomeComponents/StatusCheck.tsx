import { Box } from "@/styles/HomeStyles";
import { useCallback, useState } from "react";
import styled from "styled-components";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";

export const StatusCheck = ({}: {}) => {
  const [checkStatus, setCheckStatus] = useState("");
  const [browserInfo, setBrowserInfo] = useState<any>();

  const onClickCreateKey = useCallback(async () => {
    setCheckStatus(String(self.crossOriginIsolated));
    const data = {
      userAgent:navigator.userAgent,
      appVersion:navigator.userAgent,
      userAgentData:JSON.stringify(navigator["userAgentData"])
    }
    setBrowserInfo(JSON.stringify(data))
  }, []);

  return (
    <Box>
      <Button checkInstall={false} onClick={onClickCreateKey}>
        check status
      </Button>
      <InfoRow title={"Support Status"} type={InfoType.secondary}>
        <div>{checkStatus}</div>
      </InfoRow>

      <InfoRow title={"browser info"} type={InfoType.secondary}>
        <div>{browserInfo}</div>
      </InfoRow>
    </Box>
  );
};
