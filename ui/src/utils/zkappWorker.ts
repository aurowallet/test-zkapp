import {
  AccountUpdate,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  fetchAccount,
} from "o1js";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import type { Add } from "../contracts/add/source/Add.ts";

interface VerificationKeyData {
  data: string;
  hash: Field;
}

const state = {
  Add: null as null | typeof Add,
  zkapp: null as null | Add,
  transaction: null as null | Transaction,
  verificationKey: null as null | VerificationKeyData, //| VerificationKeyData;
};

// ---- -----------------------------------------------------------------------------------

const functions = {
  setActiveInstanceToBerkeley: async (args: { gqlUrl: string }) => {
    const Berkeley = Mina.Network(args.gqlUrl + "/graphql");
    console.log("Zk Instance Created");
    Mina.setActiveInstance(Berkeley);
  },
  loadContract: async (args: {}) => {
    const { Add } = await import("../contracts/add/Add.js");
    state.Add = Add;
  },
  compileContract: async (args: {}) => {
    const { verificationKey } = await state.Add!.compile();
    state.verificationKey = verificationKey;
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.Add!(publicKey);
  },
  getNum: async (args: {}) => {
    const currentNum = await state.zkapp!.num.get();
    return JSON.stringify(currentNum.toJSON());
  },
  createUpdateTransaction: async (args: {}) => {
    const transaction = await Mina.transaction(() => {
      state.zkapp!.update();
    });
    state.transaction = transaction;
  },
  proveUpdateTransaction: async (args: {}) => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  },
  createDeployTransaction: async (args: {
    feePayer: string;
    privateKey58: string;
  }) => {
    if (state === null) {
      throw Error("state is null");
    }
    const zkAppPrivateKey: PrivateKey = PrivateKey.fromBase58(
      args.privateKey58
    );
    const feePayerPublickKey = PublicKey.fromBase58(args.feePayer);
    const transaction = await Mina.transaction(feePayerPublickKey, () => {
      AccountUpdate.fundNewAccount(feePayerPublickKey);
      state.zkapp!.deploy({
        zkappKey: zkAppPrivateKey,
        verificationKey: state.verificationKey as VerificationKeyData,
      });
    });
    transaction.sign([zkAppPrivateKey])
    state.transaction = transaction;
  },
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
