import { fetchAccount, PublicKey, Field, PrivateKey, UInt64 } from 'o1js';

import type {
  ZkappWorkerRequest,
  ZkappWorkerReponse,
  WorkerFunctions,
} from "../token/zkappTokenWorker"

export default class ZkappWorkerClient {
  // ---------------------------------------------------------------------------------------

  setActiveInstanceToBerkeley(gqlUrl:string) {
    return this._call('setActiveInstanceToBerkeley', {gqlUrl});
  }

  loadContract() {
    return this._call('loadContract', {});
  }

  compileContract() {
    return this._call('compileContract', {});
  } 

  fetchAccount({
    publicKey,
  }: {
    publicKey: PublicKey;
  }): ReturnType<typeof fetchAccount> {
    const result = this._call('fetchAccount', {
      publicKey58: publicKey.toBase58(),
    });
    return result as ReturnType<typeof fetchAccount>;
  }

  initZkappInstance(publicKey: PublicKey) {
    return this._call('initZkappInstance', {
      publicKey58: publicKey.toBase58(),
    });
  }

  async getBalance(publicKey: PublicKey): Promise<Field> {
    const result = await this._call('getBalance', {
      publicKey58: publicKey.toBase58(),
    });
    return Field.fromJSON(JSON.parse(result as string));
  }

  createMintTransaction(senderAccount:PublicKey,mintAmount:UInt64) {
    return this._call('createMintTransaction', {
      senderAccount:senderAccount.toBase58(),
      mintAmount
    });
  }

  proveUpdateTransaction() {
    return this._call('proveUpdateTransaction', {});
  }

  async getTransactionJSON() {
    const result = await this._call('getTransactionJSON', {});
    return result;
  }
  
  async createDeployTransaction(privateKey: PrivateKey,feePayer:string) {
    return await this._call('createDeployTransaction', {
        privateKey58: PrivateKey.toBase58(privateKey),
        feePayer
    });
}

  // ---------------------------------------------------------------------------------------

  worker: Worker;

  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };

  nextId: number;

  constructor() {
    this.worker = new Worker(new URL('./zkappWorker.ts', import.meta.url));
    this.promises = {};
    this.nextId = 0;

    this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
      this.promises[event.data.id].resolve(event.data.data);
      delete this.promises[event.data.id];
    };
  }

  _call(fn: WorkerFunctions, args: any) {
    return new Promise((resolve, reject) => {
      this.promises[this.nextId] = { resolve, reject };

      const message: ZkappWorkerRequest = {
        id: this.nextId,
        fn,
        args,
      };

      this.worker.postMessage(message);

      this.nextId++;
    });
  }
}
