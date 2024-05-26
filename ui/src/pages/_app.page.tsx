'use client'

import '@/styles/globals.css'
import type { AppProps } from 'next/app'

import './reactCOIServiceWorker';
import StyledComponentsRegistry from './registry';

export default function App({ Component, pageProps }: AppProps) {
  return <StyledComponentsRegistry><Component {...pageProps} /></StyledComponentsRegistry>
}
