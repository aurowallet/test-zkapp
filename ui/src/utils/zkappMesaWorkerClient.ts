import { Field, PublicKey } from "o1js-mesa";
import type {
  MesaWorkerFunctions,
  MesaWorkerRequest,
  MesaWorkerResponse,
} from "./zkappMesaWorker";

export default class ZkappMesaWorkerClient {
  worker: Worker;
  promises: Record<number, { resolve: (value: any) => void; reject: (reason: Error) => void }> = {};
  nextId = 0;

  constructor() {
    this.worker = new Worker(new URL("./zkappMesaWorker.ts", import.meta.url));
    this.worker.onmessage = (event: MessageEvent<MesaWorkerResponse>) => {
      const pending = this.promises[event.data.id];
      if (!pending) return;
      if (event.data.error) pending.reject(new Error(event.data.error));
      else pending.resolve(event.data.data);
      delete this.promises[event.data.id];
    };
    this.worker.onerror = (event) => {
      for (const pending of Object.values(this.promises)) {
        pending.reject(new Error(event.message || "Mesa zkApp worker failed"));
      }
      this.promises = {};
    };
  }

  setActiveInstanceToMesa(gqlUrl: string, networkID: string) {
    return this.call("setActiveInstanceToMesa", { gqlUrl, networkID });
  }

  loadContract() { return this.call("loadContract", {}); }
  compileContract() { return this.call("compileContract", {}); }

  fetchAccount({ publicKey }: { publicKey: PublicKey }): Promise<void> {
    return this.call("fetchAccount", { publicKey58: publicKey.toBase58() }) as Promise<void>;
  }

  initZkappInstance(publicKey: PublicKey) {
    return this.call("initZkappInstance", { publicKey58: publicKey.toBase58() });
  }

  async getNum(): Promise<Field> {
    return Field.fromJSON(JSON.parse(await this.call("getNum", {}) as string));
  }

  createUpdateTransaction() { return this.call("createUpdateTransaction", {}); }

  createManualUpdateTransaction(value: number, zkAddress: string) {
    return this.call("createManualUpdateTransaction", { value, zkAddress });
  }

  proveUpdateTransaction() { return this.call("proveUpdateTransaction", {}); }

  createDeployTransaction(privateKey: import("o1js-mesa").PrivateKey, feePayer: string) {
    return this.call("createDeployTransaction", {
      privateKey58: privateKey.toBase58(),
      feePayer,
    });
  }

  sendProving(signedData: string) { return this.call("sendProving", { signedData }); }

  getTransactionJSON() { return this.call("getTransactionJSON", {}); }

  private call(fn: MesaWorkerFunctions, args: any) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.promises[id] = { resolve, reject };
      this.worker.postMessage({ id, fn, args } satisfies MesaWorkerRequest);
    });
  }
}
