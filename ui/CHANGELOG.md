# Changelog

All notable changes to this project will be documented in this file.


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
