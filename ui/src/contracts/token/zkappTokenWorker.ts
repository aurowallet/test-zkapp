import {
  AccountUpdate,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  UInt64,
  fetchAccount,
} from "o1js";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import type { Hooks } from "../../../../contracts/src/token/Hooks.js";
import type { Token } from "../../../../contracts/src/token/token";
interface VerificationKeyData {
  data: string;
  hash: Field;
}

const state = {
  // Token: null as any,
  Token: null as unknown as typeof Token,
  Hooks: null as unknown as typeof Hooks,
  thirdParty: null as any,
  zkapp: null as null | Token,
  transaction: null as null | Transaction,
  verificationKey: null as null | VerificationKeyData, //| VerificationKeyData;
  hooksVerificationKey: null as null | VerificationKeyData,
  zkHooks: null as null | Hooks,
  transactionHk: null as null | Transaction,
};

// ---- -----------------------------------------------------------------------------------

const functions = {
  setActiveInstanceToZk: async (args: { gqlUrl: string }) => {
    const client = Mina.Network(args.gqlUrl + "/graphql");
    console.log("Zk Instance Created");
    Mina.setActiveInstance(client);
  },
  // loadContract: async (args: {}) => {
  //   // done
  //   const { Token } = await import(
  //     "../../../../contracts/build/src/token/Token.js"
  //   );
  //   state.Token = Token;
  // },
  // compileContract: async (args: {}) => {
  //   const { verificationKey } = await state.Token!.compile();
  //   state.verificationKey = verificationKey;
  // },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  // initZkappInstance: async (args: { publicKey58: string }) => {
  //   const publicKey = PublicKey.fromBase58(args.publicKey58);
  //   state.zkapp = new state.Token!(publicKey); //  update init
  // },
  // getBalance: async (args: { publicKey58: PublicKey }) => {
  //   const currentBalance = await state.zkapp!.getBalanceOf(args.publicKey58);
  //   return JSON.stringify(currentBalance.toBigInt());
  // },
  createMintTransaction: async (args: {
    senderAccount: PublicKey;
    mintAmount: UInt64;
  }) => {
    const transaction = await Mina.transaction(() => {
      AccountUpdate.fundNewAccount(args.senderAccount, 2);
      state.zkapp!.mint(args.senderAccount, args.mintAmount);
    });
    state.transaction = transaction;
  },
  createDepositTransaction: async (args: {
    senderAccount: PublicKey;
    depositAmount: UInt64;
  }) => {
    const transaction = await Mina.transaction(args.senderAccount, () => {
      const [fromAccountUpdate] = state.zkapp!.transferFrom(
        args.senderAccount,
        args.depositAmount,
        AccountUpdate.MayUseToken.ParentsOwnToken
      );

      fromAccountUpdate.requireSignature();
    });
    state.transaction = transaction;
  },

  // proveUpdateTransaction: async (args: {}) => {
  //   await state.transaction!.prove();
  // },
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
    transaction.sign([zkAppPrivateKey]);
    state.transaction = transaction;
  },
  // loadTokenContract: async (args: {}) => {
  //   const { Token } = await import("../../../../contracts/src/token/token.js");
  //   state.Token = Token;
  // },
  compileTokenContract: async (args: {}) => {
    const { verificationKey } = await state.Token!.compile();
    state.verificationKey = verificationKey;
  },
  loadHooksContract: async (args: {}) => {
    const { Hooks } = await import(
      "../../../../contracts/build/src/token/Hooks.js"
    );
    state.Hooks = Hooks;
  },
  compileHooksContract: async (args: {}) => {
    const { verificationKey } = await state.Hooks!.compile();
    state.hooksVerificationKey = verificationKey;
  },
  createDeployHooksTransaction: async (args: {
    deployerAccount: PublicKey;
    directAdminAccount: PublicKey;
    hooksKey: PrivateKey;
  }) => {
    if (state === null) {
      throw Error("state is null");
    }
    let transactionFee = 1_000_000_000;
    const tx = await Mina.transaction(
      {
        sender: args.deployerAccount,
        fee: transactionFee,
      },
      () => {
        AccountUpdate.fundNewAccount(args.deployerAccount, 1);
        state.zkHooks!.deploy();
        state.zkHooks!.initialize(args.directAdminAccount);
      }
    );
    console.log('worker tx',tx);
    
    tx.sign([args.hooksKey]);
    console.log('sign done');
    state.transactionHk = tx;
  },
  proveUpdateTransactionHk: async (args: {}) => {
    await state.transactionHk!.prove();
  },
  initHooksInstance: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkHooks = new state.Hooks!(publicKey);
  },
  getTransactionHkJSON: async (args: {}) => {
    return state.transactionHk!.toJSON();
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
