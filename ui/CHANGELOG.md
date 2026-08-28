# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0]
### Enhancements
- Upgrade the Mesa runtime to o1js 3.0.0 while preserving Berkeley compatibility with o1js 2.15.0
- Add dedicated Mesa and Berkeley zkApp signing modules, routes, contracts, and isolated web workers
- Support Mesa 32-state and Berkeley 8-state transaction validation and wallet signing flows
- Add zkApp key generation, contract deployment, update, and sign-only transaction actions
- Separate static export builds from local server previews and remove the redundant legacy export step

### Fixes
- Prevent o1js internal values from crossing worker boundaries by serializing transaction data and worker errors
- Preserve lazy authorization and blinding values when proving a wallet-signed transaction
- Remove obsolete zkApp test transaction APIs and temporary diagnostic state
- Configure npm peer-dependency resolution for the required Berkeley/Mesa o1js versions


## [2.1.0]
### Enhancements
- Support `zeko:mainnet` as o1js custom network ID (`{ custom: "zeko-mainnet" }`) in zkApp transaction flows
- Unify network instance creation in zkApp worker and include `archive` endpoint for consistent RPC behavior
- Align `contracts/src/interact.ts` network ID resolution with the same `zeko:mainnet` mapping

## [2.0.5]
### Enhancements
- Upgrade `o1js` from `2.14.0` to `2.15.0`

## [2.0.3]
### Enhancements
- Add shared `getErrorMessage`, `hasErrorMessage`, and `hasErrorCode` helpers for wallet/provider response handling
- Support async click handlers in the shared `Button` component with unified fallback alerts for wallet actions
- Harden provider availability checks across WalletConnect, token submit, and zkApp demo flows

### Fixes
- Prevent `Cannot read properties of undefined (reading 'message')` in wallet request, signing, verification, transaction, and network switching flows
- Normalize handling for provider responses that may return undefined or non-standard error objects
- Clean up temporary wallet debug logs and verbose console output while preserving essential error reporting
