import { ChainInfoArgs } from "@aurowallet/mina-provider";

export function timeout(seconds: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });
}
