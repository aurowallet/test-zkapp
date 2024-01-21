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

async function deployToken() {
  const deployerKey = PrivateKey.fromBase58(process.env.depoly_pri as string);
  const deployerAccount = PublicKey.fromBase58(
    process.env.depoly_pub as string
  );
  console.log('init success');

  const tokenAKey = PrivateKey.random();

  const tokenAAccount = tokenAKey.toPublicKey();

  const tokenA = new Token(tokenAAccount);
  const totalSupply = UInt64.from(10_000_000_000_000);

  const Berkeley = Mina.Network(process.env.gqlUrl + '/graphql');
  Mina.setActiveInstance(Berkeley);
  console.log('setActiveInstance');

  const fetchAccountRes = await fetchAccount({
    publicKey: deployerAccount,
  });
  console.log('fetchAccountRes', fetchAccountRes.account?.balance.toString());

  await Token.compile();
  let transactionFee = 200_000_000;
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
  console.log('send res', res.hash());
}

deployToken();
