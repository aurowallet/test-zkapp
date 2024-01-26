import { PrivateKey, PublicKey, fetchAccount } from "o1js";

import type {
  WorkerFunctions,
  ZkappWorkerReponse,
  ZkappWorkerRequest,
} from "../token/zkappTokenWorker";

export default class ZkappTokenWorkerClient {
  // ---------------------------------------------------------------------------------------

  setActiveInstanceToZk(gqlUrl: string) {
    return this._call("setActiveInstanceToZk", { gqlUrl });
  }

  loadHooksContract() {
    return this._call("loadHooksContract", {});
  }

  compileHooksContract() {
    return this._call("compileHooksContract", {});
  }
  async createDeployHooksTransaction(
    deployerAccount: string,
    directAdminAccount: string,
    hooksKey: string
  ) {
    return await this._call("createDeployHooksTransaction", {
      deployerAccount: PublicKey.fromBase58(deployerAccount),
      directAdminAccount: PublicKey.fromBase58(directAdminAccount),
      hooksKey: PrivateKey.fromBase58(hooksKey),
    });
  }

  fetchAccount({
    publicKey,
  }: {
    publicKey: PublicKey;
  }): ReturnType<typeof fetchAccount> {
    const result = this._call("fetchAccount", {
      publicKey58: publicKey.toBase58(),
    });
    return result as ReturnType<typeof fetchAccount>;
  }

  proveUpdateTransactionHk() {
    return this._call("proveUpdateTransactionHk", {});
  }

  initHooksInstance(publicKey: string) {
    return this._call("initHooksInstance", {
      publicKey58: publicKey,
    });
  }

  async getTransactionHkJSON() {
    const result = await this._call("getTransactionHkJSON", {});
    return result;
  }

  // ---------------------------------------------------------------------------------------

  worker: Worker;

  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };

  nextId: number;

  constructor() {
    this.worker = new Worker(new URL("./zkappTokenWorker.ts", import.meta.url));
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
