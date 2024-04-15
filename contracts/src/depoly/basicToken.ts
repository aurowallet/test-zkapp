import * as dotenv from 'dotenv';
import {
  AccountUpdate,
  Mina,
  PrivateKey,
  PublicKey,
  Signature,
  UInt64,
  fetchAccount,
} from 'o1js';
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
    pri_58: deployerKey.toBase58(),
    pub_58: deployerAccount.toBase58(),
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
  const Berkeley = Mina.Network(process.env.gqlUrl + '/graphql');
  Mina.setActiveInstance(Berkeley);
  console.log('setActiveInstance');

  const fetchAccountRes = await fetchAccount({
    publicKey: deployKeys.pub_58,
  });
  console.log('fetchAccountRes=3');
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
  console.log('deployToken compile end', verificationKey);

  let transactionFee = 200_000_000;
  const contract = new BasicTokenContract(accountKeys.pub);
  const deploy_txn = await Mina.transaction(
    {
      sender: deployKeys.pub,
      fee: transactionFee,
    },
    () => {
      AccountUpdate.fundNewAccount(deployKeys.pub);
      contract.deploy({ verificationKey, zkappKey: accountKeys.pri });
    }
  );
  console.log('deployToken build end');
  await deploy_txn.prove();
  console.log('deployToken prove end');
  const res = await deploy_txn.sign([deployKeys.pri]).send();
  console.log('deployToken sign & send end', res.hash);
}

async function mintToken(
  zkAppKeys: AccountKeys,
  deployKeys: AccountKeys,
  mintCount: number
) {
  const mintAmount = UInt64.from(mintCount);
  await BasicTokenContract.compile();
  const contract = new BasicTokenContract(zkAppKeys.pub);

  let transactionFee = 200_000_000;
  const mintSignature = Signature.create(
    zkAppKeys.pri,
    // mintAmount.toFields().concat(zkAppKeys.pub.toFields())
    mintAmount.toFields().concat(deployKeys.pub.toFields())
  );

  const mint_txn = await Mina.transaction(
    {
      sender: deployKeys.pub,
      fee: transactionFee,
    },
    () => {
      AccountUpdate.fundNewAccount(deployKeys.pub);
      // contract.mint(zkAppKeys.pub, mintAmount, mintSignature);
      contract.mint(deployKeys.pub, mintAmount, mintSignature);
    }
  );

  await mint_txn.prove();
  const mintRes = await mint_txn.sign([deployKeys.pri]).send();

  console.log('minted', mintRes.hash);
}

async function depositToken(
  accountKeys: AccountKeys,
  deployKeys: AccountKeys,
  sendCount: number
) {
  const sendAmount = UInt64.from(sendCount);
  let transactionFee = 200_000_000;
  await BasicTokenContract.compile();
  const contract = new BasicTokenContract(accountKeys.pub);

  const send_txn = await Mina.transaction(
    {
      sender: deployKeys.pub,
      fee: transactionFee,
    },
    () => {
      AccountUpdate.fundNewAccount(deployKeys.pub);
      contract.sendTokens(accountKeys.pub, deployKeys.pub, sendAmount);
    }
  );
  await send_txn.prove();
  const sendRes = await send_txn.sign([deployKeys.pri, accountKeys.pri]).send();

  console.log('sent', sendRes.hash);

  console.log(
    contract.totalAmountInCirculation.get() +
      ' ' +
      Mina.getAccount(accountKeys.pub).tokenSymbol
  );
}

async function sendToken(
  accountKeys: AccountKeys,
  deployKeys: AccountKeys,
  sendCount: number,
  receiveAccountKeys: string
) {
  const sendAmount = UInt64.from(sendCount);
  let transactionFee = 200_000_000;
  await BasicTokenContract.compile();
  const contract = new BasicTokenContract(accountKeys.pub);

  const send_txn = await Mina.transaction(
    {
      sender: deployKeys.pub,
      fee: transactionFee,
    },
    () => {
      AccountUpdate.fundNewAccount(deployKeys.pub);
      contract.sendTokens(
        deployKeys.pub,
        PublicKey.fromBase58(receiveAccountKeys),
        sendAmount
      );
    }
  );
  await send_txn.prove();
  const sendRes = await send_txn.sign([deployKeys.pri]).send();

  console.log('sent', sendRes.hash);

  console.log(
    contract.totalAmountInCirculation.get() +
      ' ' +
      Mina.getAccount(accountKeys.pub).tokenSymbol
  );
}

async function deploy() {
  await init();
  const deployKeys = getDeployKey();
  const accountKeys = getRandomKey();
  console.log('accountKeys=', accountKeys);
  // await deployToken(accountKeys, deployKeys);

  const accountKeysTemp = {
    pri_58: '',
    pub_58: '',
    pri: PrivateKey.fromBase58(''),
    pub: PublicKey.fromBase58(''),
  };
  // const mintAmount = 100000 * 1e9;
  // await mintToken(accountKeysTemp, deployKeys, mintAmount);

  // const sendAmount = 10 * 1e9;
  // await depositToken(accountKeysTemp, deployKeys, sendAmount);

  const sendAmount2 = 2 * 1e9;
  const receiveAddress =
    'B62qpjxUpgdjzwQfd8q2gzxi99wN7SCgmofpvw27MBkfNHfHoY2VH32';
  await sendToken(accountKeysTemp, deployKeys, sendAmount2, receiveAddress);
  // 5Jv12XCNy3jNKeggqwBt5VFSWb268jEYsEPQbkTTE2q5jthMo8su
}

deploy();
