/**
 * depoly token demo
 */
import * as dotenv from 'dotenv';
import {
  AccountUpdate,
  Mina,
  PrivateKey,
  PublicKey,
  UInt64,
  fetchAccount,
} from 'o1js';
import { Token } from '../token/token.js';
import Hooks from '../token/Hooks.js';
dotenv.config();

function getDeployKey() {
  const deployerKey = PrivateKey.fromBase58(process.env.depoly_pri as string);
  const deployerAccount = PublicKey.fromBase58(
    process.env.depoly_pub as string
  );
  return {
    deployerKey,
    deployerAccount,
  };
}

async function deployToken() {
  // 1. init depoly key
  const deployKeys = getDeployKey();
  const deployerKey = deployKeys.deployerKey;
  const deployerAccount = deployKeys.deployerAccount;
  console.log('init success');

  const tokenAKey = PrivateKey.random();
  const tokenAAccount = tokenAKey.toPublicKey();
  const tokenA = new Token(tokenAAccount);

  const totalSupply = UInt64.from(10_000_000_000_000);
  let transactionFee = 200_000_000;

  const Berkeley = Mina.Network(process.env.gqlUrl + '/graphql');
  Mina.setActiveInstance(Berkeley);
  console.log('setActiveInstance');

  const fetchAccountRes = await fetchAccount({
    publicKey: deployerAccount,
  });
  console.log('fetchAccountRes', fetchAccountRes.account?.balance.toString());

  await Token.compile();
  console.log('deploy');
  let tx = await Mina.transaction(
    {
      sender: deployerAccount,
      fee: transactionFee,
    },
    () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      tokenA.deploy();
      tokenA.initialize(deployerAccount, totalSupply);
    }
  );
  console.log('build tx body');
  tx.sign([deployerKey, tokenAKey]);
  console.log('sign tx');
  await tx.prove();
  console.log('prove');
  const res = await tx.send();
  console.log('send', res.hash());
}

async function init(deployerAccount: PublicKey) {
  const Berkeley = Mina.Network(process.env.gqlUrl + '/graphql');
  Mina.setActiveInstance(Berkeley);
  console.log('setActiveInstance');

  const fetchAccountRes = await fetchAccount({
    publicKey: deployerAccount,
  });
  console.log('fetchAccountRes', fetchAccountRes.account?.balance.toString());
}
/**
 * should deploy token hooks
 */
async function deployTokenHooks() {
  const deployKeys = getDeployKey();
  const deployerKey = deployKeys.deployerKey;
  const deployerAccount = deployKeys.deployerAccount;
  await init(deployerAccount);
  console.log('init success', deployerAccount);

  const hooksKey = PrivateKey.random();
  const hooksAccount = hooksKey.toPublicKey();
  const hooks = new Hooks(hooksAccount);

  console.log('hooks==', hooksKey.toBase58(), hooksAccount.toBase58());

  const directAdminKey = PrivateKey.random();
  const directAdminAccount = directAdminKey.toPublicKey();
  console.log(
    'directAdminKey==',
    directAdminKey.toBase58(),
    directAdminAccount.toBase58()
  );

  await Hooks.compile();
  console.log('Hooks compile');
  let transactionFee = 1_000_000_000;

  const tx = await Mina.transaction(
    {
      sender: deployerAccount,
      fee: transactionFee,
    },
    () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      hooks.deploy();
      hooks.initialize(directAdminAccount);
    }
  );

  console.log('tx2', JSON.stringify(tx.transaction.feePayer.body));
  tx.sign([deployerKey, hooksKey]);

  console.log('start prove');
  await tx.prove();
  console.log('prove success');
  const sendRes = await tx.send();
  console.log('send', sendRes.hash());
}
/**
 * should deploy token contract A
 */
async function deployTokenA(hooksAccount: PublicKey) {
  const deployKeys = getDeployKey();
  const deployerKey = deployKeys.deployerKey;
  const deployerAccount = deployKeys.deployerAccount;
  console.log('init success', deployerAccount);
  await init(deployerAccount);

  const tokenAKey = PrivateKey.random();
  const tokenAAccount = tokenAKey.toPublicKey();
  const tokenA = new Token(tokenAAccount);

  const totalSupply = UInt64.from(10_000_000_000_000);
  let transactionFee = 200_000_000;

  await Token.compile();
  console.log('Token compile');
  const tx = await Mina.transaction(
    {
      sender: deployerAccount,
      fee: transactionFee,
    },
    () => {
      AccountUpdate.fundNewAccount(deployerAccount, 1);
      tokenA.deploy();
      tokenA.initialize(hooksAccount, totalSupply);
    }
  );
  console.log('tx2', JSON.stringify(tx.transaction.feePayer.body));
  tx.sign([deployerKey, tokenAKey]);
  console.log('Token sign');
  await tx.prove();
  console.log('Token prove');
  const sendRes = await tx.send();
  console.log('send', sendRes.hash());
}
/**
 * should mint for the sender account
 */
function mintTokenForSender() {
  const deployKeys = getDeployKey();
  // const deployerKey = deployKeys.deployerKey
  const deployerAccount = deployKeys.deployerAccount;
  console.log('init success', deployerAccount);
}

async function main() {
  deployToken();
  await deployTokenHooks();
  const hookKeys = {
    pri: '',
    pub: '',
  };
  const directAdminKey = {
    pri: '',
    pub: '',
  }; // done
  const hooksAccount = PublicKey.fromBase58(hookKeys.pub);
  await deployTokenA(hooksAccount);
  mintTokenForSender();
}
main();
