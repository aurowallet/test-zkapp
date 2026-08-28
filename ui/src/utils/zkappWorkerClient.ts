import { PublicKey, Field, PrivateKey } from "o1js-berkeley";

import type {
  ZkappWorkerRequest,
  ZkappWorkerReponse,
  WorkerFunctions,
} from "./zkappWorker";

export default class ZkappWorkerClient {
  setActiveInstanceToBerkeley(gqlUrl: string, networkID: string) {
    return this._call("setActiveInstanceToBerkeley", { gqlUrl, networkID });
  }

  loadContract() {
    return this._call("loadContract", {});
  }

  compileContract() {
    return this._call("compileContract", {});
  }

  fetchAccount({
    publicKey,
  }: {
    publicKey: PublicKey;
  }): Promise<{ error: unknown | null }> {
    const result = this._call("fetchAccount", {
      publicKey58: publicKey.toBase58(),
    });
    return result as Promise<{ error: unknown | null }>;
  }

  initZkappInstance(publicKey: PublicKey) {
    return this._call("initZkappInstance", {
      publicKey58: publicKey.toBase58(),
    });
  }

  async getNum(): Promise<Field> {
    const result = await this._call("getNum", {});
    return Field.fromJSON(JSON.parse(result as string));
  }

  createUpdateTransaction() {
    return this._call("createUpdateTransaction", {});
  }
  createManualUpdateTransaction(value: number, zkAddress: string) {
    return this._call("createManualUpdateTransaction", { value, zkAddress });
  }

  proveUpdateTransaction() {
    return this._call("proveUpdateTransaction", {});
  }

  async getTransactionJSON() {
    const result = await this._call("getTransactionJSON", {});
    return result;
  }

  async createDeployTransaction(privateKey: PrivateKey, feePayer: string) {
    return await this._call("createDeployTransaction", {
      privateKey58: PrivateKey.toBase58(privateKey),
      feePayer,
    });
  }

  async sendProving(signedData: string) {
    return await this._call("sendProving", { signedData });
  }

  worker: Worker;

  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };

  nextId: number;

  constructor() {
    this.worker = new Worker(new URL("./zkappWorker.ts", import.meta.url));
    this.promises = {};
    this.nextId = 0;

    this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
      const pending = this.promises[event.data.id];
      if (!pending) return;
      if (event.data.error) pending.reject(new Error(event.data.error));
      else pending.resolve(event.data.data);
      delete this.promises[event.data.id];
    };
    this.worker.onerror = (event) => {
      for (const pending of Object.values(this.promises)) {
        pending.reject(new Error(event.message || "Berkeley zkApp worker failed"));
      }
      this.promises = {};
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
