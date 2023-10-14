import styled, { css } from "styled-components";

export enum InfoType {
  primary,
  success,
  secondary,
}
const primaryCss = css`
  color: #004085;
  background-color: #cce5ff;
  border-color: #b8daff;
`;
const secondaryCss = css`
  color: #383d41;
  background-color: #e2e3e5;
  border-color: #d6d8db;
`;
const successCss = css`
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
`;
const StyledContainer = styled.div<{ type?: InfoType }>`
  width: 100%;
  display: flex;
  align-items: center;

  position: relative;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 0.25rem;

  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
  ${(props) => {
    console.log("lsp==props==", props);

    switch (props.type) {
      case InfoType.primary:
        return primaryCss;
      case InfoType.success:
        return successCss;
      case InfoType.secondary:
        return secondaryCss;
    }
  }}
`;

const StyledRowTitle = styled.div<{ isBoldTitle?: boolean }>`
  font-weight: ${(props) => (props.isBoldTitle ? 500 : 400)};
`;
const StyledRowContent = styled.div``;

export const InfoRow = ({
  type,
  title,
  content,
  isBoldTitle,
}: {
  type?: InfoType;
  title: string;
  content?: string;
  isBoldTitle?: boolean;
}) => {
  return (
    <StyledContainer type={type}>
      <StyledRowTitle isBoldTitle={isBoldTitle}>{title}</StyledRowTitle>
      <StyledRowContent>{content}</StyledRowContent>
    </StyledContainer>
  );
};
