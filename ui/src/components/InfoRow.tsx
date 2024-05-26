import React from "react";
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
  justify-content: flex-start;
  flex-direction: column;

  position: relative;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 0.25rem;

  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
  word-break: break-all;
  max-height: 200px;
  overflow: auto;
  text-overflow: ellipsis;

  ${(props) => {
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
const StyledRowContent = styled.span`
  font-weight: 400;
  
`;
const StyledLinkContent = styled.a`
  text-decoration: none;
  outline: none !important;

  cursor: pointer;
  color: #594af1;
  &:hover {
    opacity: 0.8;
  }
`;

type IInfoRow = {
  type?: InfoType;
  title: string;
  content?: string;
  linkContent?: string;
  isBoldTitle?: boolean;
  linkHref?: string;
  linkTarget?: string;
  children?: React.ReactNode;
  innerChildren?: React.ReactNode;
};

export const InfoRow: React.FC<IInfoRow> = ({
  type,
  title,
  content,
  isBoldTitle,
  linkContent,
  linkHref,
  linkTarget,
  children,
}) => {
  return (
    <StyledContainer type={type}>
      <StyledRowTitle isBoldTitle={isBoldTitle}>
        {title}
        {content && <StyledRowContent>{content}</StyledRowContent>}
        {linkHref && (
          <StyledLinkContent target={linkTarget || "_blank"} href={linkHref}>
            {linkContent}
          </StyledLinkContent>
        )}
      </StyledRowTitle>
      {children}
    </StyledContainer>
  );
};
