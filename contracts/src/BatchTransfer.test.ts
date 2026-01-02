import { AccountUpdate, Mina, PrivateKey, PublicKey, UInt64 } from 'o1js';
import { BatchTransfer } from './BatchTransfer';

/**
 * BatchTransfer 合约测试用例
 * 
 * 测试场景:
 * 1. 部署合约
 * 2. 向合约存入资金
 * 3. 单地址转账
 * 4. 批量转账 (1-8个地址)
 */

let proofsEnabled = false;

describe('BatchTransfer', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: BatchTransfer,
    recipients: Mina.TestPublicKey[];

  beforeAll(async () => {
    if (proofsEnabled) await BatchTransfer.compile();
  });

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    
    [deployerAccount, senderAccount, ...recipients] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new BatchTransfer(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  async function depositToContract(amount: UInt64) {
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.deposit(amount);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();
  }

  it('应该成功部署合约', async () => {
    await localDeploy();
    const balance = zkApp.account.balance.get();
    expect(balance).toEqual(UInt64.from(0));
  });

  it('应该成功向合约存入资金', async () => {
    await localDeploy();
    
    const depositAmount = UInt64.from(10_000_000_000); // 10 MINA
    await depositToContract(depositAmount);
    
    const balance = zkApp.account.balance.get();
    expect(balance).toEqual(depositAmount);
  });

  it('应该成功执行单笔转账', async () => {
    await localDeploy();
    
    // 存入资金
    const depositAmount = UInt64.from(10_000_000_000);
    await depositToContract(depositAmount);
    
    // 单笔转账
    const recipient = recipients[0];
    const transferAmount = UInt64.from(1_000_000_000); // 1 MINA
    const recipientBalanceBefore = Mina.getBalance(recipient);
    
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.transfer(recipient, transferAmount);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();
    
    const recipientBalanceAfter = Mina.getBalance(recipient);
    expect(recipientBalanceAfter.sub(recipientBalanceBefore)).toEqual(transferAmount);
  });

  it('应该成功执行批量转账到3个地址', async () => {
    await localDeploy();
    
    // 存入足够资金
    const depositAmount = UInt64.from(50_000_000_000); // 50 MINA
    await depositToContract(depositAmount);
    
    const recipient1 = recipients[0];
    const recipient2 = recipients[1];
    const recipient3 = recipients[2];
    const zeroAddress = PublicKey.empty();
    
    const amount1 = UInt64.from(1_000_000_000); // 1 MINA
    const amount2 = UInt64.from(2_000_000_000); // 2 MINA
    const amount3 = UInt64.from(3_000_000_000); // 3 MINA
    const zeroAmount = UInt64.from(0);
    
    const balance1Before = Mina.getBalance(recipient1);
    const balance2Before = Mina.getBalance(recipient2);
    const balance3Before = Mina.getBalance(recipient3);
    
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.batchTransfer(
        recipient1, amount1,
        recipient2, amount2,
        recipient3, amount3,
        zeroAddress, zeroAmount, // 未使用的slot
        zeroAddress, zeroAmount,
        zeroAddress, zeroAmount,
        zeroAddress, zeroAmount,
        zeroAddress, zeroAmount
      );
    });
    await txn.prove();
    await txn.sign([senderKey]).send();
    
    // 验证转账结果
    expect(Mina.getBalance(recipient1).sub(balance1Before)).toEqual(amount1);
    expect(Mina.getBalance(recipient2).sub(balance2Before)).toEqual(amount2);
    expect(Mina.getBalance(recipient3).sub(balance3Before)).toEqual(amount3);
  });

  it('应该成功执行批量转账到8个地址', async () => {
    await localDeploy();
    
    // 存入足够资金
    const depositAmount = UInt64.from(100_000_000_000); // 100 MINA
    await depositToContract(depositAmount);
    
    const amounts = [
      UInt64.from(1_000_000_000),
      UInt64.from(2_000_000_000),
      UInt64.from(3_000_000_000),
      UInt64.from(4_000_000_000),
      UInt64.from(5_000_000_000),
      UInt64.from(6_000_000_000),
      UInt64.from(7_000_000_000),
      UInt64.from(8_000_000_000),
    ];
    
    const balancesBefore = recipients.slice(0, 8).map(r => Mina.getBalance(r));
    
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.batchTransfer(
        recipients[0], amounts[0],
        recipients[1], amounts[1],
        recipients[2], amounts[2],
        recipients[3], amounts[3],
        recipients[4], amounts[4],
        recipients[5], amounts[5],
        recipients[6], amounts[6],
        recipients[7], amounts[7]
      );
    });
    await txn.prove();
    await txn.sign([senderKey]).send();
    
    // 验证所有转账
    for (let i = 0; i < 8; i++) {
      const balanceAfter = Mina.getBalance(recipients[i]);
      expect(balanceAfter.sub(balancesBefore[i])).toEqual(amounts[i]);
    }
  });

  it('金额为0的地址应该被跳过', async () => {
    await localDeploy();
    
    const depositAmount = UInt64.from(50_000_000_000);
    await depositToContract(depositAmount);
    
    const recipient1 = recipients[0];
    const recipient2 = recipients[1];
    const zeroAddress = PublicKey.empty();
    
    const amount1 = UInt64.from(1_000_000_000);
    const zeroAmount = UInt64.from(0);
    
    const balance1Before = Mina.getBalance(recipient1);
    const balance2Before = Mina.getBalance(recipient2);
    const contractBalanceBefore = zkApp.account.balance.get();
    
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.batchTransfer(
        recipient1, amount1,
        recipient2, zeroAmount, // 金额为0，应跳过
        zeroAddress, zeroAmount,
        zeroAddress, zeroAmount,
        zeroAddress, zeroAmount,
        zeroAddress, zeroAmount,
        zeroAddress, zeroAmount,
        zeroAddress, zeroAmount
      );
    });
    await txn.prove();
    await txn.sign([senderKey]).send();
    
    // recipient1 应该收到转账
    expect(Mina.getBalance(recipient1).sub(balance1Before)).toEqual(amount1);
    // recipient2 不应该收到转账 (金额为0)
    expect(Mina.getBalance(recipient2)).toEqual(balance2Before);
    // 合约余额只减少了 amount1
    expect(contractBalanceBefore.sub(zkApp.account.balance.get())).toEqual(amount1);
  });
});
