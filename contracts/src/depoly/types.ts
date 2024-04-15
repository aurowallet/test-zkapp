import { PrivateKey, PublicKey } from 'o1js';

export type AccountKeys = {
  pri: PrivateKey;
  pub: PublicKey;
  pri_58?: string;
  pub_58?: string;
};

export type AccountKeysToken = {
  privateKey: PrivateKey;
  publicKey: PublicKey;
  pri_58?: string;
  pub_58?: string;
};
