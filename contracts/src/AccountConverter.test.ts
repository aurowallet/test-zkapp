import { AccountUpdate, Mina, PrivateKey, PublicKey } from 'o1js';
import { AccountConverter } from './AccountConverter';

/**
 * AccountConverter 合约测试用例
 * 
 * 测试场景:
 * 1. 部署合约 (将普通账户转换为合约账户)
 * 2. 验证账户已转换
 * 3. 更新权限
 * 4. 获取账户信息
 */

let proofsEnabled = false;

describe('AccountConverter', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    targetAccount: Mina.TestPublicKey,
    targetKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: AccountConverter;

  beforeAll(async () => {
    if (proofsEnabled) await AccountConverter.compile();
  });

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    
    [deployerAccount, targetAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    targetKey = targetAccount.key;

    // 为合约生成新的密钥对
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new AccountConverter(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('应该成功部署合约，将账户转换为zkApp账户', async () => {
    await localDeploy();
    
    // 验证合约已部署
    const account = Mina.getAccount(zkAppAddress);
    expect(account.zkapp).toBeDefined();
    expect(account.zkapp?.verificationKey).toBeDefined();
  });

  it('应该成功调用verifyConversion验证账户已转换', async () => {
    await localDeploy();
    
    const txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.verifyConversion();
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();
    
    // 如果能成功执行，说明账户已转换为zkApp
    expect(true).toBe(true);
  });

  it('应该成功调用getAccountInfo', async () => {
    await localDeploy();
    
    const txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.getAccountInfo();
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();
    
    expect(true).toBe(true);
  });

  it('应该成功设置为签名权限模式', async () => {
    await localDeploy();
    
    // 更新权限为签名模式
    const txn = await Mina.transaction(deployerAccount, async () => {
      await zkApp.setSignaturePermissions();
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();
    
    // 验证权限已更新
    const account = Mina.getAccount(zkAppAddress);
    expect(account.permissions.editState.signatureNecessary.toBoolean()).toBe(true);
  });

  it('部署后账户应该有验证密钥', async () => {
    await localDeploy();
    
    const account = Mina.getAccount(zkAppAddress);
    
    // 验证zkApp状态
    expect(account.zkapp).toBeDefined();
    expect(account.zkapp?.verificationKey).toBeDefined();
    expect(account.zkapp?.verificationKey?.data).toBeDefined();
    expect(account.zkapp?.verificationKey?.hash).toBeDefined();
  });

  it('应该能够向已转换的合约账户发送资金', async () => {
    await localDeploy();
    
    const sendAmount = 1_000_000_000n; // 1 MINA
    const balanceBefore = Mina.getBalance(zkAppAddress);
    
    const txn = await Mina.transaction(deployerAccount, async () => {
      const senderUpdate = AccountUpdate.createSigned(deployerAccount);
      senderUpdate.send({ to: zkAppAddress, amount: sendAmount });
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();
    
    const balanceAfter = Mina.getBalance(zkAppAddress);
    expect(balanceAfter.toBigInt() - balanceBefore.toBigInt()).toEqual(sendAmount);
  });
});

/**
 * AccountConverter 使用说明
 * 
 * ## 什么是账户转换?
 * 在Mina协议中，普通账户和zkApp账户有本质区别:
 * - 普通账户: 只能进行基本的转账和质押操作
 * - zkApp账户: 可以执行智能合约逻辑，有可编程的权限控制
 * 
 * ## 如何使用AccountConverter?
 * 
 * ### 方法1: 部署到新地址 (推荐)
 * ```typescript
 * // 1. 生成新的密钥对
 * const zkAppPrivateKey = PrivateKey.random();
 * const zkAppAddress = zkAppPrivateKey.toPublicKey();
 * 
 * // 2. 创建合约实例
 * const zkApp = new AccountConverter(zkAppAddress);
 * 
 * // 3. 部署合约
 * const txn = await Mina.transaction(feePayer, async () => {
 *   AccountUpdate.fundNewAccount(feePayer); // 为新账户提供初始资金
 *   await zkApp.deploy();
 * });
 * await txn.prove();
 * await txn.sign([feePayerKey, zkAppPrivateKey]).send();
 * ```
 * 
 * ### 方法2: 使用钱包部署
 * ```typescript
 * // 在前端使用Auro钱包
 * const txn = await Mina.transaction(currentAccount, async () => {
 *   AccountUpdate.fundNewAccount(currentAccount);
 *   await zkApp.deploy();
 * });
 * await txn.prove();
 * const txJSON = txn.toJSON();
 * 
 * // 通过钱包签名并发送
 * await provider.sendTransaction({
 *   transaction: txJSON,
 *   feePayer: { fee: 0.1 }
 * });
 * ```
 * 
 * ## 转换后的账户特性
 * - 拥有验证密钥 (verification key)
 * - 可以存储8个Field类型的状态变量
 * - 所有操作需要通过证明验证
 * - 具有可编程的权限控制
 */
