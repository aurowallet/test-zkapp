# Changelog

All notable changes to this project will be documented in this file.

## [4.0.1]
### Enhancements
- Upgrade o1js 3.0.0 to 3.1.0

## [4.0.0]
### Enhancements
- Make Mesa and o1js 3.0.0 the sole UI transaction runtime
- Remove Berkeley routes, contracts, workers, and signing UI; limit WalletConnect to Mina mainnet and devnet
- Use the shared contract package for zkApp deployment, updates, and sign-only transactions
- Simplify static export and server preview builds with explicit Node.js and environment requirements

### Fixes
- Validate Mesa 32-state account updates before signing
- Serialize worker data and errors while preserving wallet-signed transaction authorizations
- Reset and terminate workers when the account, network, endpoint, or contract changes
- Keep the Mina Credential demo marked as developing with npm peer compatibility configured

## [3.0.0]
### Enhancements
- Upgrade the UI and contract runtime to o1js 3.0.0 with Mesa-only transaction support
- Use the Mesa 32-state zkApp worker for both the main site and WalletConnect flow
- Remove Berkeley dependencies, routes, contracts, signing components, and workers
- Use the contract package as the single source for both contract tests and the UI worker
- Add zkApp key generation, contract deployment, update, and sign-only transaction actions
- Separate static export builds from local server previews and remove the redundant legacy export step

### Fixes
- Prevent o1js internal values from crossing worker boundaries by serializing transaction data and worker errors
- Preserve lazy authorization and blinding values when proving a wallet-signed transaction
- Remove obsolete zkApp test transaction APIs and temporary diagnostic state
- Remove the o1js 2-only credential dependency and its peer-resolution compatibility configuration
- Reject non-32-state commands before wallet signing
- Reset and terminate zkApp workers when the account, network, endpoint, or contract changes


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
