import styled from "styled-components";
import packageJSON from "../../package.json" assert { type: "json" };

const StyledWrapper = styled.div`
  padding: 10px;
  font-weight: 500;
  font-size: 14px;
  text-align: center;
`;
export const VersionBox = () => {
  const version = packageJSON["version"];
  return <StyledWrapper>{"VERSION: "+version}</StyledWrapper>;
};
