import {
  AccountUpdate,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  fetchAccount,
} from "o1js";

import type { Add } from "auro-e2e-test-zkapp/Add";
import { getRealGqlUrl } from "./index";
import {
  deserializeMesaTransaction,
  mesaSignedTransactionParams,
  serializeMesaTransaction,
} from "./zkMesaUtils";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;
type VerificationKeyData = { data: string; hash: Field };
type O1jsNetworkID = "mainnet" | "testnet" | { custom: string };

const state = {
  Add: null as null | typeof Add,
  zkapp: null as null | Add,
  transaction: null as null | Transaction,
  verificationKey: null as null | VerificationKeyData,
  serializeTx: "",
};

const functions = {
  setActiveInstanceToMesa: async (args: { gqlUrl: string; networkID: string }) => {
    Mina.setActiveInstance(buildNetworkInstance(args.gqlUrl, args.networkID));
  },
  loadContract: async () => {
    const { Add } = await import("auro-e2e-test-zkapp/Add");
    state.Add = Add;
  },
  compileContract: async () => {
    const { verificationKey } = await state.Add!.compile();
    state.verificationKey = verificationKey;
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    await fetchAccount({ publicKey: PublicKey.fromBase58(args.publicKey58) });
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    state.zkapp = new state.Add!(PublicKey.fromBase58(args.publicKey58));
  },
  getNum: async () => JSON.stringify((await state.zkapp!.num.get()).toJSON()),
  createUpdateTransaction: async () => {
    state.transaction = await Mina.transaction(async () => {
      await state.zkapp!.update();
    });
  },
  createManualUpdateTransaction: async (args: { value: number; zkAddress: string }) => {
    const nextValue = Field(args.value);
    state.transaction = await Mina.transaction(async () => {
      await state.zkapp!.setValue(nextValue);
    });
    state.serializeTx = JSON.stringify({
      tx: serializeMesaTransaction(state.transaction),
      value: nextValue.toJSON(),
      address: args.zkAddress,
    });
  },
  proveUpdateTransaction: async () => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async () => {
    const transactionJson = state.transaction!.toJSON();
    return typeof transactionJson === "string" ? transactionJson : JSON.stringify(transactionJson);
  },
  createDeployTransaction: async (args: { feePayer: string; privateKey58: string }) => {
    const zkappPrivateKey = PrivateKey.fromBase58(args.privateKey58);
    const feePayerPublicKey = PublicKey.fromBase58(args.feePayer);
    state.transaction = await Mina.transaction(feePayerPublicKey, async () => {
      AccountUpdate.fundNewAccount(feePayerPublicKey);
      await state.zkapp!.deploy({
        verificationKey: state.verificationKey as VerificationKeyData,
      });
    });
    // Standard Mesa flow: o1js signs the zkApp account update. The connected
    // wallet signs the fee payer when it receives this command.
    state.transaction.sign([zkappPrivateKey]);
  },
  sendProving: async (args: { signedData: string }) => {
    const { tx: serializedTransaction, value, address } = JSON.parse(state.serializeTx);
    const zkappPublicKey = PublicKey.fromBase58(address);
    const { fee, sender, nonce } = mesaSignedTransactionParams(args.signedData);
    await fetchAccount({ publicKey: sender });
    await fetchAccount({ publicKey: zkappPublicKey });
    const { Add } = await import("auro-e2e-test-zkapp/Add");
    const zkapp = new Add(zkappPublicKey);
    const txNew = await Mina.transaction({ sender, fee, nonce }, async () => {
      await zkapp.setValue(Field.fromJSON(value));
    });
    const tx = deserializeMesaTransaction(serializedTransaction, txNew, args.signedData);
    await Add.compile();
    await tx.prove();
    const sent = await tx.send();
    return String(sent.hash || "");
  },
};

export type MesaWorkerFunctions = keyof typeof functions;
export type MesaWorkerRequest = { id: number; fn: MesaWorkerFunctions; args: any };
export type MesaWorkerResponse = { id: number; data?: any; error?: string };

if (typeof window !== "undefined") {
  addEventListener("message", async (event: MessageEvent<MesaWorkerRequest>) => {
    try {
      const data = await functions[event.data.fn](event.data.args);
      // Fail before postMessage if a future o1js API leaks an internal object.
      structuredClone(data);
      postMessage({ id: event.data.id, data } satisfies MesaWorkerResponse);
    } catch (error) {
      postMessage({
        id: event.data.id,
        error: `${event.data.fn}: ${error instanceof Error ? error.message : String(error)}`,
      } satisfies MesaWorkerResponse);
    }
  });
}

function buildNetworkInstance(gqlUrl: string, networkID: string) {
  if (!gqlUrl?.trim()) throw new Error("GraphQL URL is required");
  if (!networkID?.trim()) throw new Error("Network ID is required");

  const graphqlUrl = getRealGqlUrl(gqlUrl);
  return Mina.Network({
    networkId: resolveO1jsNetworkID(networkID),
    mina: graphqlUrl,
    archive: graphqlUrl,
  });
}

function resolveO1jsNetworkID(networkID: string): O1jsNetworkID {
  if (typeof networkID !== "string" || !networkID.trim()) return "testnet";

  const [namespace, suffix] = networkID.split(":");
  if (namespace === "mina") return suffix === "mainnet" ? "mainnet" : "testnet";
  if (namespace === "zeko" && suffix === "mainnet") return { custom: "zeko-mainnet" };
  return "testnet";
}
