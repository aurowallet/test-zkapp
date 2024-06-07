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

import type { Add } from "../contracts/source/Add.ts";
import {
  deserializeTransaction,
  serializeTransaction,
  transactionParams,
  transactionParamsV2,
} from "./zkUtils.ts";

interface VerificationKeyData {
  data: string;
  hash: Field;
}

const state = {
  Add: null as null | typeof Add,
  zkapp: null as null | Add,
  transaction: null as null | Transaction,
  verificationKey: null as null | VerificationKeyData, //| VerificationKeyData;
  serializeTx: "",
};

// ---- -----------------------------------------------------------------------------------

const functions = {
  setActiveInstanceToBerkeley: async (args: { gqlUrl: string,networkID:any }) => {
    const network = Mina.Network({
      // the networkID is returned in daemon node
      // extension now not support return networkID , so add cache to there
      networkId: getInitNetworkID(args.networkID),
      mina: args.gqlUrl + "/graphql",
    });
    Mina.setActiveInstance(network);
  },
  loadContract: async (args: {}) => {
    const { Add } = await import("../contracts/Add");
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
    console.log('createUpdateTransaction networkID',Mina.getNetworkId());
    const transaction = await Mina.transaction(async () => {
      await state.zkapp!.update();
    });
    state.transaction = transaction;
  },
  createManulUpdateTransaction: async (args: {
    value: number;
    zkAddress: string;
  }) => {
    console.log('createManulUpdateTransaction networkID = 0, ',Mina.getNetworkId());
    const nextValue = Field(args.value);
    const transaction = await Mina.transaction(async () => {
      await state.zkapp!.setValue(nextValue);
    });
    console.log('createManulUpdateTransaction networkID = 1,',Mina.getNetworkId());
    state.transaction = transaction;
    const data: string = JSON.stringify(
      {
        tx: serializeTransaction(transaction),
        value: nextValue.toJSON(),
        address: args.zkAddress,
      },
      null,
      2
    );
    state.serializeTx = data;
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
    console.log('createDeployTransaction networkID',Mina.getNetworkId());
    const transaction = await Mina.transaction(feePayerPublickKey, async () => {
      AccountUpdate.fundNewAccount(feePayerPublickKey);
      await state.zkapp!.deploy({
        verificationKey: state.verificationKey as VerificationKeyData,
      });
    });
    transaction.sign([zkAppPrivateKey]);
    state.transaction = transaction;
  },
  signAndSendTx: async (args: {
    publicKey: string;
    sendPrivateKey: string;
    gqlUrl: string;
    networkID:any;
  }) => {
    const network = Mina.Network({
      // the networkID is returned in daemon node
      // extension now not support return networkID , so add cache to there
      networkId: getInitNetworkID(args.networkID),
      mina: args.gqlUrl + "/graphql",
    });
    Mina.setActiveInstance(network);
    console.log('signAndSendTx networkID',Mina.getNetworkId());
    const { Add } = await import("../contracts/Add");
    const zkPublicKey = PublicKey.fromBase58(args.publicKey);
    const zkApp = new Add(zkPublicKey);
    await Add.compile();
    const deployer = PrivateKey.fromBase58(args.sendPrivateKey);
    const sender = deployer.toPublicKey();
    const value = Field(10);
    const fee = 1e8;
    await fetchAccount({ publicKey: sender });
    await fetchAccount({ publicKey: zkPublicKey });
    const tx = await Mina.transaction({ sender, fee }, async () => {
      await zkApp.setValue(value);
    });
    tx.sign([deployer]);
    await tx.prove();
    const sendRes = await tx.send();
    return sendRes.hash;
  },
  buildTxBody: async (args: {
    zkPublicKey: string;
    sendPrivateKey: string;
    gqlUrl: string;
    networkID:any
  }) => {
    const network = Mina.Network({
      // the networkID is returned in daemon node
      // extension now not support return networkID , so add cache to there
      networkId: getInitNetworkID(args.networkID),
      mina: args.gqlUrl + "/graphql",
    });
    Mina.setActiveInstance(network);
    console.log('buildTxBody networkID',Mina.getNetworkId());
    const { Add } = await import("../contracts/Add");
    const zkPublicKey = PublicKey.fromBase58(args.zkPublicKey);
    const zkApp = new Add(zkPublicKey);
    const deployer = PrivateKey.fromBase58(args.sendPrivateKey);
    const sender = deployer.toPublicKey();
    const value = Field(1);
    const fee = 1e8;
    await fetchAccount({ publicKey: sender });
    await fetchAccount({ publicKey: zkPublicKey });
    const tx = await Mina.transaction({ sender, fee }, async () => {
      await zkApp.setValue(value);
    });
    tx.sign([deployer]);
    const data: string = JSON.stringify(
      {
        tx: serializeTransaction(tx),
        value: value.toJSON(),
        address: args.zkPublicKey,
      },
      null,
      2
    );
    return data;
  },
  onlyProving: async (args: { signedData: string; gqlUrl: string,networkID:any }) => {
    const {
      tx: serializedTransaction,
      value,
      address,
    } = JSON.parse(args.signedData);
    const zkAppPublicKey = PublicKey.fromBase58(address);
    const { fee, sender, nonce } = transactionParams(serializedTransaction);
    const network = Mina.Network({
      // the networkID is returned in daemon node
      // extension now not support return networkID , so add cache to there
      networkId: getInitNetworkID(args.networkID),
      mina: args.gqlUrl + "/graphql",
    });
    Mina.setActiveInstance(network);
    console.log('onlyProving networkID',Mina.getNetworkId());
    const { Add } = await import("../contracts/Add");
    const zkApp = new Add(zkAppPublicKey);
    await fetchAccount({ publicKey: sender });
    await fetchAccount({ publicKey: zkAppPublicKey });
    const txNew = await Mina.transaction({ sender, fee, nonce }, async () => {
      await zkApp.setValue(Field.fromJSON(value));
    });
    const tx = deserializeTransaction(serializedTransaction, txNew);
    await Add.compile();
    await tx.prove();
    const txSent = await tx.send();// have cors issue
    return txSent.hash;
  },

  sendProving: async (args: { signedData: string }) => {
    const {
      tx: serializedTransaction,
      value,
      address,
    } = JSON.parse(state.serializeTx);
    const zkAppPublicKey = PublicKey.fromBase58(address);
    const { fee, sender, nonce } = transactionParamsV2(args.signedData);
    await fetchAccount({ publicKey: sender });
    await fetchAccount({ publicKey: zkAppPublicKey });

    const { Add } = await import("../contracts/Add");
    const zkApp = new Add(zkAppPublicKey);
    console.log('sendProving networkID',Mina.getNetworkId());
    const txNew = await Mina.transaction({ sender, fee, nonce }, async () => {
      await zkApp!.setValue(Field.fromJSON(value));
    });
    const tx = deserializeTransaction(
      serializedTransaction,
      txNew,
      true,
      args.signedData
    );
    await Add.compile();
    await tx.prove();
    const txSent = await tx.send();
    return txSent.hash;
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

function getInitNetworkID(networkID:string){
  console.log('getInitNetworkID params: ',networkID);
  const nextID = networkID === 'mina:mainnet' ? "mainnet":"testnet"
  console.log('getInitNetworkID nextID: ',nextID);
  return nextID
}