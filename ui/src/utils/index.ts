import { ChainInfoArgs } from "@aurowallet/mina-provider";

export function timeout(seconds: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });
}

export function formatNetwork(network: ChainInfoArgs|undefined) {
  if(!network){
    return ""
  }
  return network?.name + " : " + network?.chainId ;
}
