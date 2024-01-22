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

/**
 * should deploy token hooks
 */
function deployTokenHooks() {
  const deployKeys = getDeployKey();
  // const deployerKey = deployKeys.deployerKey
  const deployerAccount = deployKeys.deployerAccount;
  console.log('init success', deployerAccount);
}
/**
 * should deploy token contract A
 */
function deployTokenA() {
  const deployKeys = getDeployKey();
  // const deployerKey = deployKeys.deployerKey
  const deployerAccount = deployKeys.deployerAccount;
  console.log('init success', deployerAccount);
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

function main() {
  deployToken();
  deployTokenHooks();
  deployTokenA();
  mintTokenForSender();
}
main();
