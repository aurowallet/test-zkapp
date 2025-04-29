import { useCallback } from "react";
import styled from "styled-components";
import { useMinaProvider } from "@/context/MinaProviderContext";

export const StyledButton = styled.button`
  background-color: #6b5dfb;
  color: white;
  display: block;
  text-align: center;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  font-weight: 400;
  font-size: 0.94rem;
  line-height: 1.5;
  border-radius: 0.3rem;
  border: 1px solid transparent;
  padding: 0.5rem 1rem;
  width: 100%;
  margin-bottom: 1rem;
  max-height: 40px;

  &:hover {
    text-decoration: none;
    background-color: #4f3efd;
    color: white;
  }
  &:focus {
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
  &:disabled {
    opacity: 0.65;
  }
`;

export interface IButton {
  children?: React.ReactNode;
  disabled?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  checkConnection?: boolean;
}

export const Button = ({
  children,
  disabled,
  onClick,
  checkConnection = false,
}: IButton) => {
  const { provider } = useMinaProvider();

  const onClickBtn = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (checkConnection) {
        if (!provider) {
          alert("Auro Wallet not detected. Please install Auro Wallet.");
          return;
        }

        try {
          // Check if accounts are connected
          const accounts = await provider.getAccounts();
          if (accounts.length === 0) {
            // Prompt user to connect
            await provider.requestAccounts();
            // Re-check accounts after connection attempt
            const newAccounts = await provider.getAccounts();
            if (newAccounts.length === 0) {
              alert("Failed to connect Auro Wallet. Please try again.");
              return;
            }
          }
          // Proceed with original onClick if connected
          onClick(e);
        } catch (error) {
          console.error("Error checking wallet connection:", error);
          alert("Error connecting to Auro Wallet: " + String(error));
          return;
        }
      } else {
        // No connection check, proceed directly
        onClick(e);
      }
    },
    [onClick, checkConnection, provider]
  );

  return (
    <StyledButton disabled={disabled} onClick={onClickBtn}>
      {children}
    </StyledButton>
  );
};