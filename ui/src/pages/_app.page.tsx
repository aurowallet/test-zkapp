"use client";

import "@/styles/globals.css";
import type { AppProps } from "next/app";

import "./reactCOIServiceWorker";
import StyledComponentsRegistry from "./registry";
import { AuroMinaProvider } from "@/context/MinaProviderContext";
import { LanguageProvider } from "@/context/LanguageContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuroMinaProvider>
      <LanguageProvider>
        <StyledComponentsRegistry>
          <Component {...pageProps} />
        </StyledComponentsRegistry>
      </LanguageProvider>
    </AuroMinaProvider>
  );
}
