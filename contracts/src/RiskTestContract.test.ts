import { AccountUpdate, Field, Mina, PrivateKey, PublicKey, UInt32, UInt64 } from 'o1js';
import { RiskTestContract, TokenFlowTestContract } from './RiskTestContract';

/**
 * RiskTestContract 测试用例
 * 
 * 测试场景覆盖钱包可检测的所有风险类型:
 * 1. 高风险 - send 权限 Impossible (资金锁定)
 * 2. 高风险 - receive 权限 Impossible
 * 3. 高风险 - setPermissions Impossible (权限锁定)
 * 4. 高风险 - access 权限 Impossible
 * 5. 高风险 - timing 设置 (时间锁)
 * 6. 中风险 - 权限变更
 * 7. 中风险 - 委托变更
 * 8. 中风险 - 验证密钥权限变更
 * 9. 复合风险测试
 */

let proofsEnabled = false;

describe('RiskTestContract - 风险场景测试', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: RiskTestContract,
    otherAccounts: Mina.TestPublicKey[];

  beforeAll(async () => {
    if (proofsEnabled) await RiskTestContract.compile();
  });

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    
    [deployerAccount, senderAccount, ...otherAccounts] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new RiskTestContract(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  describe('无风险场景', () => {
    it('应该成功执行普通状态更新', async () => {
      await localDeploy();
      
      const txn = await Mina.transaction(senderAccount, async () => {
        await zkApp.safeUpdate(Field(42));
      });
      await txn.prove();
      await txn.sign([senderKey]).send();
      
      expect(zkApp.value.get()).toEqual(Field(42));
    });
  });

  describe('高风险场景 - 权限 Impossible', () => {
    it('应该能执行 lockSendPermission (高风险: send=impossible)', async () => {
      await localDeploy();
      
      const txn = await Mina.transaction(senderAccount, async () => {
        await zkApp.lockSendPermission();
      });
      await txn.prove();
      await txn.sign([senderKey]).send();
      
      // 验证权限已更改
      const account = Mina.getAccount(zkAppAddress);
      expect(account.permissions.send.constant.toBoolean()).toBe(true);
    });

    it('应该能执行 lockReceivePermission (高风险: receive=impossible)', async () => {
      await localDeploy();
      
      const txn = await Mina.transaction(senderAccount, async () => {
        await zkApp.lockReceivePermission();
      });
      await txn.prove();
      await txn.sign([senderKey]).send();
      
      const account = Mina.getAccount(zkAppAddress);
      expect(account.permissions.receive.constant.toBoolean()).toBe(true);
    });

    it('应该能执行 lockAllPermissions (高风险: setPermissions=impossible)', async () => {
      await localDeploy();
      
      const txn = await Mina.transaction(senderAccount, async () => {
        await zkApp.lockAllPermissions();
      });
      await txn.prove();
      await txn.sign([senderKey]).send();
      
      const account = Mina.getAccount(zkAppAddress);
      expect(account.permissions.setPermissions.constant.toBoolean()).toBe(true);
    });

    it('应该能执行 lockAccessPermission (高风险: access=impossible)', async () => {
      await localDeploy();
      
      const txn = await Mina.transaction(senderAccount, async () => {
        await zkApp.lockAccessPermission();
      });
      await txn.prove();
      await txn.sign([senderKey]).send();
      
      const account = Mina.getAccount(zkAppAddress);
      expect(account.permissions.access.constant.toBoolean()).toBe(true);
    });
  });

  describe('高风险场景 - 时间锁', () => {
    it('应该能执行 setTimingLock (高风险: timing 修改)', async () => {
      await localDeploy();
      
      // 先存入一些资金
      const depositTxn = await Mina.transaction(senderAccount, async () => {
        await zkApp.receiveFunds(UInt64.from(10_000_000_000));
      });
      await depositTxn.prove();
      await depositTxn.sign([senderKey]).send();
      
      const txn = await Mina.transaction(senderAccount, async () => {
        await zkApp.setTimingLock(
          UInt64.from(5_000_000_000), // initialBalance: 5 MINA
          UInt32.from(100),           // cliffTime: slot 100
          UInt64.from(1_000_000_000), // cliffAmount: 1 MINA
          UInt32.from(10),            // vestingPeriod: 10 slots
          UInt64.from(500_000_000)    // vestingIncrement: 0.5 MINA
        );
      });
      await txn.prove();
      await txn.sign([senderKey]).send();
      
      // 验证 timing 已设置
      const account = Mina.getAccount(zkAppAddress);
      expect(account.timing.isTimed.toBoolean()).toBe(true);
    });
  });

  describe('中风险场景 - 权限变更', () => {
    it('应该能执行 weakenPermissions (中风险: 权限降级)', async () => {
      await localDeploy();
      
      const txn = await Mina.transaction(senderAccount, async () => {
        await zkApp.weakenPermissions();
      });
      await txn.prove();
      await txn.sign([senderKey]).send();
      
      // 权限已从 proof 改为 signature
      const account = Mina.getAccount(zkAppAddress);
      expect(account.permissions.editState.signatureNecessary.toBoolean()).toBe(true);
    });

    it('应该能执行 changeVerificationKeyPermission (中风险)', async () => {
      await localDeploy();
      
      const txn = await Mina.transaction(senderAccount, async () => {
        await zkApp.changeVerificationKeyPermission();
      });
      await txn.prove();
      await txn.sign([senderKey]).send();
      
      expect(true).toBe(true); // 成功执行即可
    });
  });

  describe('中风险场景 - 委托变更', () => {
    it('应该能执行 changeDelegation (中风险: 委托变更)', async () => {
      await localDeploy();
      
      const newDelegate = otherAccounts[0];
      
      const txn = await Mina.transaction(senderAccount, async () => {
        await zkApp.changeDelegation(newDelegate);
      });
      await txn.prove();
      await txn.sign([senderKey]).send();
      
      const account = Mina.getAccount(zkAppAddress);
      expect(account.delegate?.toBase58()).toEqual(newDelegate.toBase58());
    });
  });

  describe('复合风险场景', () => {
    it('应该能执行 multipleRiskActions (多重风险: 锁定发送+接收+降低安全等级)', async () => {
      await localDeploy();
      
      const txn = await Mina.transaction(senderAccount, async () => {
        await zkApp.multipleRiskActions();
      });
      await txn.prove();
      await txn.sign([senderKey]).send();
      
      const account = Mina.getAccount(zkAppAddress);
      // 验证 send 权限被锁定为 impossible
      expect(account.permissions.send.constant.toBoolean()).toBe(true);
      // 验证 receive 权限被锁定为 impossible
      expect(account.permissions.receive.constant.toBoolean()).toBe(true);
    });
  });

  describe('Token Flow 测试', () => {
    it('应该能执行 sendFunds (资金发送)', async () => {
      await localDeploy();
      
      // 先存入资金
      const depositTxn = await Mina.transaction(senderAccount, async () => {
        await zkApp.receiveFunds(UInt64.from(10_000_000_000));
      });
      await depositTxn.prove();
      await depositTxn.sign([senderKey]).send();
      
      const recipient = otherAccounts[0];
      const balanceBefore = Mina.getBalance(recipient);
      
      const txn = await Mina.transaction(senderAccount, async () => {
        await zkApp.sendFunds(recipient, UInt64.from(1_000_000_000));
      });
      await txn.prove();
      await txn.sign([senderKey]).send();
      
      const balanceAfter = Mina.getBalance(recipient);
      expect(balanceAfter.sub(balanceBefore).toBigInt()).toBe(1_000_000_000n);
    });

    it('应该能执行 receiveFunds (资金接收)', async () => {
      await localDeploy();
      
      const contractBalanceBefore = Mina.getBalance(zkAppAddress);
      
      const txn = await Mina.transaction(senderAccount, async () => {
        await zkApp.receiveFunds(UInt64.from(5_000_000_000));
      });
      await txn.prove();
      await txn.sign([senderKey]).send();
      
      const contractBalanceAfter = Mina.getBalance(zkAppAddress);
      expect(contractBalanceAfter.sub(contractBalanceBefore).toBigInt()).toBe(5_000_000_000n);
    });
  });
});

describe('TokenFlowTestContract - 代币流向测试', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: TokenFlowTestContract,
    recipients: Mina.TestPublicKey[];

  beforeAll(async () => {
    if (proofsEnabled) await TokenFlowTestContract.compile();
  });

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    
    [deployerAccount, senderAccount, ...recipients] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new TokenFlowTestContract(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('应该成功执行多地址发送', async () => {
    await localDeploy();
    
    // 存入资金
    const depositTxn = await Mina.transaction(senderAccount, async () => {
      await zkApp.deposit(UInt64.from(50_000_000_000));
    });
    await depositTxn.prove();
    await depositTxn.sign([senderKey]).send();
    
    const amount1 = UInt64.from(1_000_000_000);
    const amount2 = UInt64.from(2_000_000_000);
    const amount3 = UInt64.from(3_000_000_000);
    
    const balance1Before = Mina.getBalance(recipients[0]);
    const balance2Before = Mina.getBalance(recipients[1]);
    const balance3Before = Mina.getBalance(recipients[2]);
    
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.multiSend(
        recipients[0], amount1,
        recipients[1], amount2,
        recipients[2], amount3
      );
    });
    await txn.prove();
    await txn.sign([senderKey]).send();
    
    expect(Mina.getBalance(recipients[0]).sub(balance1Before)).toEqual(amount1);
    expect(Mina.getBalance(recipients[1]).sub(balance2Before)).toEqual(amount2);
    expect(Mina.getBalance(recipients[2]).sub(balance3Before)).toEqual(amount3);
  });

  it('应该成功执行存取操作', async () => {
    await localDeploy();
    
    // 存入
    const depositAmount = UInt64.from(10_000_000_000);
    const depositTxn = await Mina.transaction(senderAccount, async () => {
      await zkApp.deposit(depositAmount);
    });
    await depositTxn.prove();
    await depositTxn.sign([senderKey]).send();
    
    expect(Mina.getBalance(zkAppAddress)).toEqual(depositAmount);
    
    // 提取
    const withdrawAmount = UInt64.from(3_000_000_000);
    const senderBalanceBefore = Mina.getBalance(senderAccount);
    
    const withdrawTxn = await Mina.transaction(senderAccount, async () => {
      await zkApp.withdraw(withdrawAmount);
    });
    await withdrawTxn.prove();
    await withdrawTxn.sign([senderKey]).send();
    
    // 注意: 需要减去交易费用，这里简化验证
    expect(Mina.getBalance(zkAppAddress).toBigInt()).toBe(7_000_000_000n);
  });
});

/**
 * 使用说明
 * 
 * ## RiskTestContract 风险测试合约
 * 
 * 此合约用于测试钱包的交易风险检测功能。每个方法对应一种风险场景:
 * 
 * ### 高风险方法 (钱包应显示红色警告)
 * - `lockSendPermission()` - 锁定发送权限，资金永久无法转出
 * - `lockReceivePermission()` - 锁定接收权限，无法收款
 * - `lockAllPermissions()` - 锁定权限修改能力，不可逆
 * - `lockAccessPermission()` - 锁定访问权限
 * - `setTimingLock()` - 设置时间锁，资金在指定时间前无法使用
 * - `multipleRiskActions()` - 同时执行多个危险操作
 * 
 * ### 中风险方法 (钱包应显示黄色警告)
 * - `weakenPermissions()` - 降低权限等级 (proof -> signature)
 * - `changeDelegation()` - 修改质押委托
 * - `changeVerificationKeyPermission()` - 修改验证密钥权限
 * 
 * ### 无风险方法 (钱包无需警告)
 * - `safeUpdate()` - 普通状态更新
 * - `sendFunds()` - 普通资金发送
 * - `receiveFunds()` - 普通资金接收
 * 
 * ## 测试步骤
 * 1. 部署合约
 * 2. 在UI中选择要测试的风险场景
 * 3. 执行交易，观察钱包的风险提示
 * 4. 验证钱包是否正确识别风险类型和等级
 */
