import * as dotenv from 'dotenv';
import { AccountUpdate, Mina, PrivateKey, PublicKey, fetchAccount } from 'o1js';
import { BasicTokenContract } from '../basicToken/BasicTokenContract.js';
import { AccountKeys } from './types';
dotenv.config();

/**
 * get deploy key
 * @returns
 */
function getDeployKey() {
  const deployerKey = PrivateKey.fromBase58(process.env.depoly_pri as string);
  const deployerAccount = PublicKey.fromBase58(
    process.env.depoly_pub as string
  );
  return {
    pri: deployerKey,
    pub: deployerAccount,
  };
}

/**
 * get random account key
 */
function getRandomKey(): AccountKeys {
  const zkAppPrivateKey = PrivateKey.random();
  const zkAppAddress = zkAppPrivateKey.toPublicKey();
  return {
    pri: zkAppPrivateKey,
    pub: zkAppAddress,
    pri_58: zkAppPrivateKey.toBase58(),
    pub_58: zkAppAddress.toBase58(),
  };
}

/**
 * init mina
 * @returns
 */
async function init() {
  const deployKeys = getDeployKey();
  const deployerAccount = deployKeys.pub;
  //   console.log('fetchAccountRes=1', process.env.gqlUrl);
  const Berkeley = Mina.Network(process.env.gqlUrl + '');
  Mina.setActiveInstance(Berkeley);
  console.log('setActiveInstance');

  const fetchAccountRes = await fetchAccount({
    publicKey: deployerAccount,
  });
  console.log('fetchAccountRes=2', fetchAccountRes);
  const account = fetchAccountRes.account;

  if (!account) {
    throw new Error('check account');
  }
  console.log('fetchAccountRes', account?.balance.toString(), account?.nonce);
  return {
    balance: fetchAccountRes.account?.balance.toString(),
    nonce: fetchAccountRes.account?.nonce,
  };
}

async function deployToken(accountKeys: AccountKeys, deployKeys: AccountKeys) {
  let verificationKey: any;
  ({ verificationKey } = await BasicTokenContract.compile());
  console.log('deployToken compile end');
  const contract = new BasicTokenContract(accountKeys.pub);
  let transactionFee = 200_000_000;
  const deploy_txn = await Mina.transaction(
    {
      sender: accountKeys.pub,
      fee: transactionFee,
    },
    () => {
      AccountUpdate.fundNewAccount(accountKeys.pub);
      contract.deploy({ verificationKey, zkappKey: accountKeys.pri });
    }
  );
  console.log('deployToken build end');
  await deploy_txn.prove();
  console.log('deployToken prove end');
  const res = await deploy_txn.sign([deployKeys.pri]).send();
  console.log('deployToken sign & send end', res.hash());
}

async function deploy() {
  await init();
  const deployKeys = getDeployKey();
  const accountKeys = getRandomKey();
  await deployToken(accountKeys, deployKeys);
}

deploy();
