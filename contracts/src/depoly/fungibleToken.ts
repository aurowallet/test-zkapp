import * as dotenv from 'dotenv';
import { FungibleToken } from 'mina-fungible-token';
import {
  AccountUpdate,
  Mina,
  PrivateKey,
  PublicKey,
  UInt64,
  fetchAccount,
} from 'o1js';
import { AccountKeysToken } from './types';
dotenv.config();

async function init(deployerAccount: PublicKey) {
  const Berkeley = Mina.Network(process.env.gqlUrl + '');
  Mina.setActiveInstance(Berkeley);

  const fetchAccountRes = await fetchAccount({
    publicKey: deployerAccount,
  });
  return {
    balance: fetchAccountRes.account?.balance.toString(),
    nonce: fetchAccountRes.account?.nonce,
  };
}

async function deployTokenContract(fee: any) {
  const token = new FungibleToken(keysMap().token.publicKey);
  await FungibleToken.compile();
  const totalSupply = UInt64.from(1000_000_000_000_000);
  const tx = await Mina.transaction(
    {
      sender: keysMap().deployer.publicKey,
      fee,
    },
    async () => {
      AccountUpdate.fundNewAccount(keysMap().deployer.publicKey);
      await token.deploy({
        owner: keysMap().owner.publicKey,
        supply: UInt64.from(totalSupply),
        symbol: 'bbb',
        src: 'https://github.com/MinaFoundation/mina-fungible-token/blob/main/examples/e2e.eg.ts',
      });
    }
  );
  tx.sign([keysMap().deployer.privateKey, keysMap().token.privateKey]);
  const timeStart = new Date();
  console.log('deployKeys=4,', timeStart);
  await tx.prove();
  const timeEnd = new Date();
  console.log('deployKeys==5,', timeEnd, Number(timeEnd) - Number(timeStart));

  const deployTxResult = await tx.send();
  console.log('Deploy tx result hash,:', deployTxResult.hash);
  console.log('Deploy tx result toPretty,:', deployTxResult.toPretty());
}

async function mintTokenToAlexa(fee: any) {
  const token = new FungibleToken(keysMap().token.publicKey);
  await FungibleToken.compile();
  const mintTx = await Mina.transaction(
    {
      sender: keysMap().owner.publicKey,
      fee,
    },
    async () => {
      AccountUpdate.fundNewAccount(keysMap().owner.publicKey, 1);
      await token.mint(
        keysMap().billy.publicKey,
        UInt64.from(1_000_000_000_000)
      );
    }
  );
  const timeStart = new Date();
  console.log('Minting new tokens to Alexa. =2', timeStart);
  await mintTx.prove();
  const timeEnd = new Date();
  console.log(
    'Minting new tokens to Alexa. =3',
    timeEnd,
    Number(timeEnd) - Number(timeStart)
  );
  mintTx.sign([keysMap().owner.privateKey]);
  const mintTxResult = await mintTx.send();
  console.log('Mint tx result hash:', mintTxResult.hash);
  console.log('Mint tx result toPretty:', mintTxResult.toPretty());
}

function keysMap() {
  const deployer = {
    pri_58: '',
    pub_58: '',
  };
  const token_2 = {
    pri_58: '',
    pub_58: '',
  };
  const owner = {
    pri_58: '',
    pub_58: '',
  };
  const alexa = {
    pri_58: '',
    pub_58: '',
  };
  const billy = {
    pri_58: '',
    pub_58: '',
  };
  return {
    token: {
      privateKey: PrivateKey.fromBase58(token_2.pri_58),
      publicKey: PublicKey.fromBase58(token_2.pub_58),
      pri_58: token_2.pri_58,
      pub_58: token_2.pub_58,
    },
    deployer: {
      privateKey: PrivateKey.fromBase58(deployer.pri_58),
      publicKey: PublicKey.fromBase58(deployer.pub_58),
      pri_58: deployer.pri_58,
      pub_58: deployer.pub_58,
    },
    owner: {
      privateKey: PrivateKey.fromBase58(owner.pri_58),
      publicKey: PublicKey.fromBase58(owner.pub_58),
      pri_58: owner.pri_58,
      pub_58: owner.pub_58,
    },
    alexa: {
      privateKey: PrivateKey.fromBase58(alexa.pri_58),
      publicKey: PublicKey.fromBase58(alexa.pub_58),
      pri_58: alexa.pri_58,
      pub_58: alexa.pub_58,
    },
    billy: {
      privateKey: PrivateKey.fromBase58(billy.pri_58),
      publicKey: PublicKey.fromBase58(billy.pub_58),
      pri_58: billy.pri_58,
      pub_58: billy.pub_58,
    },
  };
}

async function sendTokenFromAlexa(fee: any) {
  const token = new FungibleToken(keysMap().token.publicKey);
  await FungibleToken.compile();
  const transferTx = await Mina.transaction(
    {
      sender: keysMap().alexa.publicKey,
      fee,
    },
    async () => {
      AccountUpdate.fundNewAccount(keysMap().alexa.publicKey, 1);
      await token.transfer(
        keysMap().alexa.publicKey,
        keysMap().billy.publicKey,
        new UInt64(1e6)
      );
    }
  );
  await transferTx.prove();
  transferTx.sign([keysMap().alexa.privateKey, keysMap().billy.privateKey]);
  const transferTxResult = await transferTx.send();
  console.log('Transfer tx result hash ,:', transferTxResult.hash);
  console.log('Transfer tx result toPretty,:', transferTxResult.toPretty());
}

async function sendTokenFromBill(fee: any) {
  const token = new FungibleToken(keysMap().token.publicKey);
  await FungibleToken.compile();

  const billBalanceAfterMint = (
    await token.getBalanceOf(keysMap().billy.publicKey)
  ).toBigInt();
  console.log('bill balance after mint:', billBalanceAfterMint);

  const transferTx = await Mina.transaction(
    {
      sender: keysMap().billy.publicKey,
      fee,
    },
    async () => {
      AccountUpdate.fundNewAccount(keysMap().billy.publicKey, 1);
      await token.transfer(
        keysMap().billy.publicKey,
        keysMap().alexa.publicKey,
        new UInt64(2e8)
      );
    }
  );
  const timeStart = new Date();
  console.log('sendTokenFromAlexa==1,', timeStart);
  await transferTx.prove();
  const timeEnd = new Date();
  console.log(
    'sendTokenFromAlexa new tokens to Alexa. =1-0',
    timeEnd,
    Number(timeEnd) - Number(timeStart)
  );
  transferTx.sign([keysMap().billy.privateKey]);
  const timeEnd2 = new Date();
  console.log(
    'sendTokenFromAlexa==3,',
    timeEnd2,
    Number(timeEnd2) - Number(timeEnd)
  );
  const transferTxResult = await transferTx.send();
  const timeEnd3 = new Date();
  console.log(
    'sendTokenFromAlexa==4,',
    timeEnd3,
    Number(timeEnd3) - Number(timeEnd2)
  );
  console.log('Transfer tx hash,:', transferTxResult.hash);
  console.log('Transfer tx toPretty,:', transferTxResult.toPretty());
}
/**
 * success
 * @param burnAccount
 * @param fee
 */
async function burnToken(burnAccount: AccountKeysToken, fee: any) {
  const token = new FungibleToken(keysMap().token.publicKey);
  await FungibleToken.compile();
  const burnTx = await Mina.transaction(
    {
      sender: burnAccount.publicKey,
      fee,
    },
    async () => {
      await token.burn(burnAccount.publicKey, new UInt64(1e7));
    }
  );
  const timeStart = new Date();
  console.log('burnToken==3,', timeStart);
  await burnTx.prove();
  const timeEnd = new Date();
  console.log('burnToken==4,', timeEnd, Number(timeEnd) - Number(timeStart));
  burnTx.sign([burnAccount.privateKey]);
  console.log('burnToken==5,');

  const burnTxResult = await burnTx.send();
  console.log('burnToken tx hash,:', burnTxResult.hash);
  console.log('burnToken tx pretty,:', burnTxResult.toPretty());

  const billyBalanceAfterBurn = (
    await token.getBalanceOf(burnAccount.publicKey)
  ).toBigInt();
  console.log('Billy balance after burn:', billyBalanceAfterBurn);
}

async function getContractInfo() {
  await fetchAccount({
    publicKey: keysMap().token.publicKey,
  });

  const token = new FungibleToken(keysMap().token.publicKey);

  await fetchAccount({
    publicKey: keysMap().billy.publicKey,
    tokenId: token.deriveTokenId(),
  });

  const billyBalance = (
    await token.getBalanceOf(keysMap().billy.publicKey)
  ).toBigInt();
  console.log('billy token balance,', billyBalance);

  const supply = (await token.getSupply()).toBigInt();
  console.log('supply,', supply);

  const circulating = (await token.getCirculating()).toBigInt();
  console.log('circulating,', circulating);

  const decimals = (await token.getDecimals()).toBigInt();
  console.log('decimals,', decimals);
}

async function depoly() {
  await init(keysMap().deployer.publicKey);
  const fee = 5e8;
  // await deployTokenContract(fee);
  // await mintTokenToAlexa(fee);
  // await sendTokenFromAlexa(fee);
  // await sendTokenFromBill(fee);
  // await burnToken(keysMap().billy, fee);

  await getContractInfo();
}
depoly();
