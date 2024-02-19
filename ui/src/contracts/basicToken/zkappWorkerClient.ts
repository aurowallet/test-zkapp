import { PublicKey, fetchAccount } from "o1js";

import type {
  WorkerFunctions,
  ZkappWorkerReponse,
  ZkappWorkerRequest,
} from "./zkappWorker";

export default class ZkappWorkerClient {
  // ---------------------------------------------------------------------------------------

  setActiveInstanceToBerkeley(gqlUrl: string) {
    return this._call("setActiveInstanceToBerkeley", { gqlUrl });
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
  }): ReturnType<typeof fetchAccount> {
    const result = this._call("fetchAccount", {
      publicKey58: publicKey.toBase58(),
    });
    return result as ReturnType<typeof fetchAccount>;
  }

  initZkappInstance(publicKey: string) {
    return this._call("initZkappInstance", {
      publicKey58: publicKey,
    });
  }

  proveDeployTransaction() {
    return this._call("proveDeployTransaction", {});
  }
  async getDeployTransactionJSON() {
    const result = await this._call("getDeployTransactionJSON", {});
    return result;
  }

  async createDeployTransaction(feePayer_58: string, zkPri_58: string) {
    return await this._call("createDeployTransaction", {
      feePayer_58,
      zkPri_58,
    });
  }
  // mint
  proveMintTransaction() {
    return this._call("proveMintTransaction", {});
  }
  async getMintTransactionJSON() {
    const result = await this._call("getMintTransactionJSON", {});
    return result;
  }

  async createMintTransaction(
    feePayer_58: string,
    zkPri_58: string,
    mintCount: number
  ) {
    return await this._call("createMintTransaction", {
      feePayer_58,
      zkPri_58,
      mintCount,
    });
  }

  proveDepositTransaction() {
    return this._call("proveDepositTransaction", {});
  }
  async getDepositTransactionJSON() {
    const result = await this._call("getDepositTransactionJSON", {});
    return result;
  }

  async createDepositTransaction(
    feePayer_58: string,
    zkPri_58: string,
    receive_58: string,
    depositCount: number
  ) {
    return await this._call("createDepositTransaction", {
      feePayer_58,
      zkPri_58,
      receive_58,
      depositCount,
    });
  }

  // ---------------------------------------------------------------------------------------

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
