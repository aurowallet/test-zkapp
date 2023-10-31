import { GITHUB_URL } from "@/constants/config";
import React from "react";
import styled from "styled-components";

const StyledCornerWrapper = styled.div`
  position: absolute;
  right: 0;
  top: 0;
`;
const StyledCornerImg = styled.img``;
export const GithubCorner = () => {
  return (
    <StyledCornerWrapper>
      <a href={GITHUB_URL} target="_blank">
        <StyledCornerImg src="/imgs/github.svg" />
      </a>
    </StyledCornerWrapper>
  );
};
