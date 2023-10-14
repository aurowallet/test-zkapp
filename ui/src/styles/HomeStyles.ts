import styled, { css } from "styled-components";
import { devices } from "./common";

export const PageContainer = styled.div`
`;

export const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  background-color: aqua;
  overflow: scroll;
`;

export const Box = styled.div`
  display: flex !important;
  flex-direction: column;
  margin: 10px;
  padding: 10px;
  width: -webkit-fill-available;

  position: relative;
  -ms-flex-direction: column;
  min-width: 0;
  word-wrap: break-word;
  background-color: #fff;
  background-clip: border-box;
  border: 1px solid rgba(0, 0, 0, 0.125);
  border-radius: 0.25rem;
  
  flex: 0 0 100%;
  max-width: calc(100% - 20px);
  background-color: green;

  @media ${devices.mobile} {
    flex: 0 0 100%;
    max-width: calc(100% - 20px);
    background-color: green;
  }

  @media ${devices.tablet} {
    flex: 0 0 100%;
    max-width: calc(100% - 20px);
    background-color: gray;
  }
  @media ${devices.tabletL} {
    flex: 0 0 50%;
    max-width: calc(50% - 20px);
    background-color: gray;
  }

  @media ${devices.desktop} {
    background-color: beige;
    flex: 0 0 calc(33.3333% - 20px);
    max-width: calc(33.3333% - 20px);
  }
`;

export const StyledRowSection = styled.section`
  display: block;
`;

export const StyledRowTitle = styled.h3`
  padding: 20px;
  margin-bottom: 0.75rem;
`;
