import styled, { css } from "styled-components";
import { devices } from "./common";

export const PageContainer = styled.div``;

export const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
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

  box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12);

  @media ${devices.mobile} {
    flex: 0 0 100%;
    max-width: calc(100% - 20px);
  }

  @media ${devices.tablet} {
    flex: 0 0 100%;
    max-width: calc(100% - 20px);
  }
  @media ${devices.tabletL} {
    flex: 0 0 50%;
    max-width: calc(50% - 20px);
  }

  @media ${devices.desktop} {
    flex: 0 0 calc(33.3333% - 20px);
    max-width: calc(33.3333% - 20px);
  }
`;

export const StyledRowSection = styled.section`
  display: block;
`;

export const StyledRowTitle = styled.div`
  padding: 20px;
  font-weight: 300;
  font-size: 1.5rem;
  color: #212529;
  text-align: left;
`;

export const StyledStatusRowWrapper = styled.div`
  display: flex;
  
  box-shadow: none;
  border: none;
  padding: 0px;
  
  flex-direction: column;
  margin: 10px;
  width: -webkit-fill-available;

  position: relative;
  min-width: 0;
  word-wrap: break-word;
  background-color: #fff;
  background-clip: border-box;
  border-radius: 0.25rem;

  flex: 0 0 100%;
  max-width: calc(100% - 20px);

  @media ${devices.mobile} {
    flex: 0 0 100%;
    max-width: calc(100% - 20px);
  }

  @media ${devices.tablet} {
    flex: 0 0 100%;
    max-width: calc(100% - 20px);
  }
  @media ${devices.tabletL} {
    flex: 0 0 50%;
    max-width: calc(50% - 20px);
  }

  @media ${devices.desktop} {
    flex: 0 0 calc(33.3333% - 20px);
    max-width: calc(33.3333% - 20px);
  }
`;

export const StyledPageTitle = styled.h1`
  padding-top: 15px;
  padding-bottom: 5px;
  text-align: center;
  font-size: 2.5rem;
  font-weight: 300;
  margin-bottom: 0.5rem;
  line-height: 1.2;
  margin-top: 0;
  color: #212529;
`;

export const StyledBoxTitle = styled.div`
  font-weight: 400;
  margin-top: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.5rem;
  line-height: 1.2;
  color: #212529;
  text-align: left;
`;

export const StyledDividedLine = styled.hr`
  margin-bottom: 1rem;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
`;
