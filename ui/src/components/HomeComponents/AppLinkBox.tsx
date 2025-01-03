import { BASE_APPLINK_URL, DefaultSupportNetorkIDs } from "@/constants/config";
import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { useCallback, useState } from "react";
import styled from "styled-components";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";
const SelectWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
`;

const StyledSelect = styled.select`
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  background-color: #fff;
  cursor: pointer;
  &:hover {
    border-color: #888;
  }
`;

const StyledOption = styled.option`
  font-size: 14px;
  color: #333;
`;

export const AppLinksBox = ({}: {}) => {
  const [network, setNetwork] = useState("");
  const [targetUrl, setTargetUrl] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setNetwork(event.target.value);
    console.log(`Selected network: ${event.target.value}`);
  };

  const onUpdateUrl = useCallback((e: any) => {
    setTargetUrl(e.target.value);
  }, []);

  const onClickJump = useCallback(async () => {
    let lastUrl = targetUrl.trim();
    if (!lastUrl) {
      return;
    }
    let baseUrl = BASE_APPLINK_URL + "?action=openurl&";
    if (network) {
      baseUrl = baseUrl + `&networkid=${encodeURIComponent(network)}`;
    }
    baseUrl = baseUrl + `&url=${encodeURIComponent(lastUrl)}`;
    window.location.href = baseUrl;
  }, [targetUrl, network]);

  const deepLinkJump = useCallback(() => {
    let lastUrl = targetUrl.trim();
    if (!lastUrl) {
      return;
    }
    let baseUrl = "aurowallet://deeplink?action=openurl";
    if (network) {
      baseUrl = baseUrl + `&networkid=${encodeURIComponent(network)}`;
    }
    window.location.href = baseUrl + `&url=${encodeURIComponent(lastUrl)}`;
  }, [targetUrl, network]);
  return (
    <Box>
      <StyledBoxTitle>AppLinks Actions (Mobile App)</StyledBoxTitle>

      <Input placeholder="Input taget url" onChange={onUpdateUrl} />
      <SelectWrapper>
        <p>Select Network (Options):</p>
        <StyledSelect
          id="network-select"
          value={network}
          onChange={handleChange}
        >
          <StyledOption value="">-- Select a network --</StyledOption>
          {Object.values(DefaultSupportNetorkIDs).map((value) => {
            return <StyledOption value={value} key={value}>{value}</StyledOption>;
          })}
        </StyledSelect>
      </SelectWrapper>
      <StyledDividedLine />
      <InfoRow
        title="without pop-winow Account: "
        content={"noWindowAccount"}
        type={InfoType.secondary}
      />
      <Button checkInstall={false} onClick={onClickJump}>
        App Links
      </Button>
      <StyledDividedLine />
      <Button checkInstall={false} onClick={deepLinkJump}>
        DeepLink
      </Button>
    </Box>
  );
};
