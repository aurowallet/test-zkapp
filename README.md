# Auro-e2e-test-zkApp 
This is an example of how zkApp interacts with Auro Wallet. 

The project targets the Mesa protocol only and uses `o1js@3.0.0`.

## Project Structure
**contracts**

Code of the zkApp contract. If you need to update the contract, please modify it in this folder.

**ui**

Code for interaction between zkApp and Auro Wallet.



## Local Development

### Dependencies
- `Node.js >=22.19.5`
- `npm 10.x`

### Run in local

1. Install and build the contract in the `contracts` folder
```sh
cd contracts
npm install
npm run build
```

2. Start serve

```sh
cd ../ui
npm install
npm run dev
```

Configure only contracts deployed from `contracts/src/Add.ts` with
`o1js@3.0.0`.

## Source

[API Document](https://docs.aurowallet.com/general/)
