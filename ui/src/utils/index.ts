import { ChainInfoArgs } from "@aurowallet/mina-provider";

export function timeout(seconds: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });
}

export function addressSlice(
  address: string,
  sliceLength = 8,
  lastLength = ""
) {
  if (address) {
    let realLastLength = lastLength ? lastLength : sliceLength;
    return `${address.slice(0, sliceLength)}...${address.slice(
      -realLastLength
    )}`;
  }
  return address;
}
