import {
  AccountUpdate,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  Signature,
  UInt64,
  fetchAccount,
} from "o1js";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import { BasicTokenContract } from "./source/BasicTokenContract.ts";

interface VerificationKeyData {
  data: string;
  hash: Field;
}

const state = {
  Token: null as null | typeof BasicTokenContract,
  zkapp: null as null | BasicTokenContract,
  deployTransaction: null as null | Transaction,
  verificationKey: null as null | VerificationKeyData,
  mintTransaction: null as null | Transaction,
};

// ---- -----------------------------------------------------------------------------------

const functions = {
  setActiveInstanceToBerkeley: async (args: { gqlUrl: string }) => {
    const Berkeley = Mina.Network(args.gqlUrl + "/graphql");
    console.log("Zk Instance Created");
    Mina.setActiveInstance(Berkeley);
  },
  loadContract: async (args: {}) => {
    const { BasicTokenContract } = await import("./BasicTokenContract.js");
    state.Token = BasicTokenContract;
  },
  compileContract: async (args: {}) => {
    const { verificationKey } = await state.Token!.compile();
    state.verificationKey = verificationKey;
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.Token!(publicKey);
  },
  proveDeployTransaction: async (args: {}) => {
    await state.deployTransaction!.prove();
  },
  getDeployTransactionJSON: async (args: {}) => {
    return state.deployTransaction!.toJSON();
  },
  createDeployTransaction: async (args: {
    feePayer_58: string;
    zkPri_58: string;
  }) => {
    if (state === null) {
      throw Error("state is null");
    }

    let transactionFee = 200_000_000;

    const zkPrivateKey = PrivateKey.fromBase58(args.zkPri_58);
    const feePayer = PublicKey.fromBase58(args.feePayer_58);

    const deploy_txn = await Mina.transaction(
      {
        sender: feePayer,
        fee: transactionFee,
      },
      () => {
        AccountUpdate.fundNewAccount(feePayer);
        state.zkapp!.deploy({
          verificationKey: state.verificationKey as VerificationKeyData,
          zkappKey: zkPrivateKey,
        });
      }
    );
    deploy_txn.sign([zkPrivateKey]);
    state.deployTransaction = deploy_txn;
  },
  // mint
  proveMintTransaction: async (args: {}) => {
    await state.mintTransaction!.prove();
  },
  getMintTransactionJSON: async (args: {}) => {
    return state.mintTransaction!.toJSON();
  },
  createMintTransaction: async (args: {
    feePayer_58: string;
    zkPri_58: string;
    mintCount: number;
  }) => {
    if (state === null) {
      throw Error("state is null");
    }

    const mintAmount = UInt64.from(args.mintCount);
    let transactionFee = 200_000_000;

    const feePayer = PublicKey.fromBase58(args.feePayer_58);
    const zkPrivateKey = PrivateKey.fromBase58(args.zkPri_58);

    const mintSignature = Signature.create(
      zkPrivateKey,
      mintAmount.toFields().concat(feePayer.toFields())
    );

    const mint_txn = await Mina.transaction(
      {
        sender: feePayer,
        fee: transactionFee,
      },
      () => {
        AccountUpdate.fundNewAccount(feePayer);
        state.zkapp!.mint(feePayer, mintAmount, mintSignature);
      }
    );
    mint_txn.sign([zkPrivateKey]);
    state.mintTransaction = mint_txn;
  },
  // deposit
  // send
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};

if (typeof window !== "undefined") {
  addEventListener(
    "message",
    async (event: MessageEvent<ZkappWorkerRequest>) => {
      const returnData = await functions[event.data.fn](event.data.args);

      const message: ZkappWorkerReponse = {
        id: event.data.id,
        data: returnData,
      };
      postMessage(message);
    }
  );
}

console.log("Web Worker Successfully Initialized.");
