"use client";

import "@/styles/globals.css";
import type { AppProps } from "next/app";

import "./reactCOIServiceWorker";
import StyledComponentsRegistry from "./registry";
import { AuroMinaProvider } from "@/context/MinaProviderContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuroMinaProvider>
      <StyledComponentsRegistry>
        <Component {...pageProps} />
      </StyledComponentsRegistry>
    </AuroMinaProvider>
  );
}
