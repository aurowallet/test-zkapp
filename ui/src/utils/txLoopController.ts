import { Mina, checkZkappTransaction } from "o1js";

export default class TxLoopController {
  private readonly pollingIntervalMs: number = 6000;
  graphqlURL: string;
  constructor(graphqlURL: string) {
    this.graphqlURL = graphqlURL;
    Mina.setActiveInstance(Mina.Network(this.graphqlURL + "/graphql"));
  }
  // Placeholder for the method that checks the transaction status
  private async checkTransaction(transactionId: string): Promise<
    | {
        success: boolean;
        failureReason: string[];
      }
    | {
        success: boolean;
        failureReason: null;
      }
  > {
    const res = await checkZkappTransaction(transactionId);
    return res;
  }

  // Starts polling for a transaction status, stops after 1 minute
  public pollTransaction(transactionId: string): Promise<
    | {
        success: boolean;
        failureReason: string[];
      }
    | {
        success: boolean;
        failureReason: null;
      }
  > {
    return new Promise((resolve) => {
      const intervalId = setInterval(async () => {
        console.log("Loop hash: " + transactionId);

        const res = await this.checkTransaction(transactionId);
        if (res.success || (!res.success && res.failureReason)) {
          console.log("Transaction successful!");
          clearInterval(intervalId); // Stop the polling when tx confirmed
          resolve(res);
        }
      }, this.pollingIntervalMs);
    });
  }
}
