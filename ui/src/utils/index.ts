import { ChainInfoArgs } from "@aurowallet/mina-provider";
import { PrivateKey } from "o1js";

export function timeout(seconds: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });
}

export function formatNetwork(network: ChainInfoArgs | undefined) {
  if (!network) {
    return "";
  }
  return network?.name + " : " + network?.chainId;
}

export function getNewAccount() {
  let zkAppPrivateKey = PrivateKey.random();
  let zkAppAddress = zkAppPrivateKey.toPublicKey();
  return {
    pri: zkAppPrivateKey,
    pub: zkAppAddress,
    pri_58: zkAppPrivateKey.toBase58(),
    pub_58: zkAppAddress.toBase58(),
  };
}
