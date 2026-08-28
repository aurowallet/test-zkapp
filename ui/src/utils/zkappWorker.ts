import {
  AccountUpdate,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  fetchAccount,
} from "o1js-berkeley";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

import type { AddBerkeley } from "../contracts/AddBerkeley";
import { getRealGqlUrl } from "./index.ts";
import {
  deserializeTransaction,
  serializeTransaction,
  transactionParamsV2,
} from "./zkUtils.ts";

interface VerificationKeyData {
  data: string;
  hash: Field;
}

type O1jsNetworkID = "mainnet" | "testnet" | { custom: string };

const state = {
  Add: null as null | typeof AddBerkeley,
  zkapp: null as null | AddBerkeley,
  transaction: null as null | Transaction,
  verificationKey: null as null | VerificationKeyData,
  serializeTx: "",
};

// ---- -----------------------------------------------------------------------------------

const functions = {
  setActiveInstanceToBerkeley: async (args: {
    gqlUrl: string;
    networkID: string;
  }) => {
    const network = buildNetworkInstance(args.gqlUrl, args.networkID);
    Mina.setActiveInstance(network);
  },
  loadContract: async () => {
    const { AddBerkeley } = await import("../contracts/AddBerkeley");
    state.Add = AddBerkeley;
  },
  compileContract: async () => {
    const { verificationKey } = await state.Add!.compile();
    state.verificationKey = verificationKey;
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    const account = await fetchAccount({ publicKey });
    return { error: account.error ?? null };
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.Add!(publicKey);
  },
  getNum: async () => {
    const currentNum = await state.zkapp!.num.get();
    return JSON.stringify(currentNum.toJSON());
  },
  createUpdateTransaction: async () => {
    const transaction = await Mina.transaction(async () => {
      await state.zkapp!.update();
    });
    state.transaction = transaction;
  },
  createManualUpdateTransaction: async (args: {
    value: number;
    zkAddress: string;
  }) => {
    const nextValue = Field(args.value);
    const transaction = await Mina.transaction(async () => {
      await state.zkapp!.setValue(nextValue);
    });
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
  proveUpdateTransaction: async () => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async () => {
    return state.transaction!.toJSON();
  },
  createDeployTransaction: async (args: {
    feePayer: string;
    privateKey58: string;
  }) => {
    const zkAppPrivateKey: PrivateKey = PrivateKey.fromBase58(
      args.privateKey58
    );
    const feePayerPublicKey = PublicKey.fromBase58(args.feePayer);
    const transaction = await Mina.transaction(feePayerPublicKey, async () => {
      AccountUpdate.fundNewAccount(feePayerPublicKey);
      await state.zkapp!.deploy({
        verificationKey: state.verificationKey as VerificationKeyData,
      });
    });
    transaction.sign([zkAppPrivateKey]);
    state.transaction = transaction;
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

    const { AddBerkeley } = await import("../contracts/AddBerkeley");
    const zkApp = new AddBerkeley(zkAppPublicKey);
    const txNew = await Mina.transaction({ sender, fee, nonce }, async () => {
      await zkApp!.setValue(Field.fromJSON(value));
    });
    const tx = deserializeTransaction(
      serializedTransaction,
      txNew,
      true,
      args.signedData
    );
    await AddBerkeley.compile();
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
  data?: any;
  error?: string;
};

if (typeof window !== "undefined") {
  addEventListener(
    "message",
    async (event: MessageEvent<ZkappWorkerRequest>) => {
      try {
        const data = await functions[event.data.fn](event.data.args);
        structuredClone(data);
        postMessage({ id: event.data.id, data } satisfies ZkappWorkerReponse);
      } catch (error) {
        postMessage({
          id: event.data.id,
          error: String(error instanceof Error ? error.message : error),
        } satisfies ZkappWorkerReponse);
      }
    }
  );
}

function buildNetworkInstance(gqlUrl: string, networkID: string) {
  const realGqlUrl = getRealGqlUrl(gqlUrl);
  return Mina.Network({
    networkId: resolveO1jsNetworkID(networkID),
    mina: realGqlUrl,
    archive: realGqlUrl,
  });
}

function resolveO1jsNetworkID(networkID: string): O1jsNetworkID {
  if (typeof networkID !== "string" || !networkID.trim()) {
    return "testnet";
  }

  const [namespace, suffix] = networkID.split(":");

  if (namespace === "mina") {
    return suffix === "mainnet" ? "mainnet" : "testnet";
  }

  if (namespace === "zeko" && suffix === "mainnet") {
    return { custom: "zeko-mainnet" };
  }

  return "testnet";
}
