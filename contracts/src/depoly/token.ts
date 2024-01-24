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
import Hooks from '../token/Hooks.js';
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

async function init(deployerAccount: PublicKey) {
  const Berkeley = Mina.Network(process.env.gqlUrl + '/graphql');
  Mina.setActiveInstance(Berkeley);
  console.log('setActiveInstance');

  const fetchAccountRes = await fetchAccount({
    publicKey: deployerAccount,
  });
  console.log('fetchAccountRes');
  return {
    balance: fetchAccountRes.account?.balance.toString(),
    nonce: fetchAccountRes.account?.nonce,
  };
}
/**
 * should deploy token hooks
 */
async function deployTokenHooks() {
  const deployKeys = getDeployKey();
  const deployerKey = deployKeys.deployerKey;
  const deployerAccount = deployKeys.deployerAccount;
  const initRes = await init(deployerAccount);
  console.log('init success', initRes);

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

  console.log('tx', JSON.stringify(tx.transaction.feePayer.body));
  tx.sign([deployerKey, hooksKey]);

  console.log('start prove');
  await tx.prove();
  console.log('prove success');
  const sendRes = await tx.send();
  console.log('send', sendRes.hash());
  return {
    hash: sendRes.hash(),
    directAdminKey: {
      pri: directAdminKey.toBase58(),
      pub: directAdminAccount.toBase58(),
    },
    hooksKey: {
      pri: hooksKey.toBase58(),
      pub: hooksAccount.toBase58(),
    },
  };
}
/**
 * should deploy token contract A
 */
async function deployTokenA(hooksAccount: PublicKey) {
  const deployKeys = getDeployKey();
  const deployerKey = deployKeys.deployerKey;
  const deployerAccount = deployKeys.deployerAccount;
  console.log('init success', deployerAccount);
  const initRes = await init(deployerAccount);
  console.log('init success', initRes);

  const tokenAKey = PrivateKey.random();
  const tokenAAccount = tokenAKey.toPublicKey();
  const tokenA = new Token(tokenAAccount);

  console.log('tokenAKey==', tokenAKey.toBase58(), tokenAAccount.toBase58());

  const totalSupply = UInt64.from(1000_000_000_000_000);
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
      // tokenA.account.tokenSymbol.set("TEST2")
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
  return {
    hash: sendRes.hash(),
    tokenAKeys: {
      pri: tokenAKey.toBase58(),
      pub: tokenAAccount.toBase58(),
    },
  };
}
/**
 * should mint for the sender account
 */
async function mintTokenForSender(
  tokenA: Token,
  tokenApublicKey: string,
  directAdminKey: PrivateKey
) {
  const mintAmount = UInt64.from(1_000_000_000_000);

  const deployKeys = getDeployKey();
  const deployerKey = deployKeys.deployerKey;
  const deployerAccount = deployKeys.deployerAccount;
  console.log('init success', deployerAccount.toBase58());
  console.log('tokenApublicKey', tokenApublicKey);

  const initRes = await init(deployerAccount);
  console.log('initRes', initRes);
  const fetchAccountRes = await fetchAccount({
    publicKey: tokenApublicKey,
  });
  console.log('fetchAccountRes', fetchAccountRes.account?.balance.toString());

  await Hooks.compile();
  await Token.compile();
  console.log('Token compile');
  let transactionFee = 1_000_000_000;

  const tx = await Mina.transaction(
    {
      sender: deployerAccount,
      fee: transactionFee,
    },
    () => {
      // eslint-disable-next-line no-warning-comments
      // TODO: it looks like the 'directAdmin' account
      // is also created and needs to be paid for
      AccountUpdate.fundNewAccount(deployerAccount, 2);
      tokenA.mint(deployerAccount, mintAmount);
    }
  );
  console.log('tx', JSON.stringify(tx.transaction.feePayer.body));
  tx.sign([deployerKey, directAdminKey]);
  console.log('start prove');
  await tx.prove();
  console.log('prove success');
  const sendRes = await tx.send();
  console.log('send', sendRes.hash());
  return {
    hash: sendRes.hash(),
  };
}

async function getContractInfo(tokenAKeyPub: string) {
  // const tokenAKey = keyList.tokenAKeys;
  const tokenA = new Token(PublicKey.fromBase58(tokenAKeyPub));

  const deployerAccount = getDeployKey().deployerAccount;
  await init(deployerAccount);

  const zkAppAccount = await fetchAccount({
    publicKey: tokenAKeyPub,
  });
  console.log('init success', JSON.stringify(zkAppAccount.account, null, 2));

  // const account = tokenA.getAccountOf(deployerAccount);// result dismatch
  // console.log('account==0', account.balance.get().toJSON());

  // const balance = tokenA.getBalanceOf(deployerAccount); // result dismatch
  // console.log('balance==0', balance.toJSON());

  const totalSupply = tokenA.getTotalSupply();
  console.log('totalSupply', totalSupply.toJSON());

  const circulatingSupply = tokenA.getCirculatingSupply();
  console.log('circulatingSupply', circulatingSupply.toJSON());

  const decimals = tokenA.getDecimals();
  console.log('decimals', decimals.toJSON());

  const paused = tokenA.getPaused();
  console.log('paused', paused.toJSON());

  const hooks = tokenA.getHooks();
  console.log('hooks', hooks.toJSON());

  return {
    decimals,
  };
}
function getDeployRes() {
  let list = [
    {
      directAdminKey: {
        pri: '',
        pub: '',
      },
      hooksKey: {
        pri: '',
        pub: '',
      },
      tokenAKeys: {
        pri: '',
        pub: '',
      },
    },
  ];
  return list[3];
}

enum ActionType {
  initHook,
  initTokenA,
  mintToken,
  getBalance,
}
async function main(type?: ActionType) {
  if (type === ActionType.initHook) {
    // 1. init Hook
    const deployRes = await deployTokenHooks();
    console.log('deployRes', deployRes);
  }

  const keyList = getDeployRes();
  if (type === ActionType.initTokenA) {
    // 2. init tokenA
    const hooksAccount = PublicKey.fromBase58(keyList.hooksKey.pub);
    const res = await deployTokenA(hooksAccount);
    console.log('deployTokenA', res);
  }

  if (type === ActionType.mintToken) {
    // 3. mint token
    const tokenAKey = keyList.tokenAKeys;
    const tokenA = new Token(PublicKey.fromBase58(tokenAKey?.pub as string));

    const mintRes = await mintTokenForSender(
      tokenA,
      tokenAKey?.pub as string,
      PrivateKey.fromBase58(keyList.directAdminKey.pri)
    );
    console.log('mintRes', mintRes);
  }

  if (ActionType.getBalance) {
    const tokenInfo = await getContractInfo(keyList.tokenAKeys.pub as string);
    console.log('tokenInfo', tokenInfo);
  }

  // 4. burn token
  // 5. deposit token
  // 6. paused
}
function entry() {
  main(ActionType.getBalance);
}

entry();
