import {
  SmartContract,
  method,
  PublicKey,
  UInt64,
  UInt32,
  AccountUpdate,
  Permissions,
  state,
  State,
  Field,
  Bool,
  Provable,
} from 'o1js';

/**
 * RiskTestContract - 风险测试合约
 * 用于测试钱包的交易风险检测功能
 * 
 * 可测试的风险场景:
 * 1. 转换为 zkApp 账户 (设置 verificationKey) - 高风险
 * 2. 权限设置为 Impossible (access/send/receive) - 高风险
 * 3. 权限锁定 (setPermissions 设为 Impossible) - 高风险
 * 4. 时间锁/归属设置 (timing 修改) - 高风险
 * 5. 权限变更 - 中风险
 * 6. 委托变更 - 中风险
 * 7. 验证密钥变更 - 中风险
 */
export class RiskTestContract extends SmartContract {
  @state(Field) value = State<Field>();

  init() {
    super.init();
    this.value.set(Field(0));
    // Set permissions to allow proof-based modifications
    // access must be none() to allow external account updates to interact
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proof(),
      send: Permissions.proof(),
      receive: Permissions.none(),
      setPermissions: Permissions.proof(),
      setDelegate: Permissions.proof(),
      setTiming: Permissions.proof(),
      setVotingFor: Permissions.proof(),
      setZkappUri: Permissions.proof(),
      editActionState: Permissions.proof(),
      setTokenSymbol: Permissions.proof(),
      incrementNonce: Permissions.proof(),
      setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
      access: Permissions.none(),
    });
  }

  /**
   * 场景1: 普通状态更新 (无风险)
   * 用于对比测试
   */
  @method async safeUpdate(newValue: Field) {
    this.value.set(newValue);
  }

  // 基础权限配置 - 保留 setDelegate 和 setPermissions 为 proof
  private getBasePermissions() {
    return {
      ...Permissions.default(),
      editState: Permissions.proof(),
      send: Permissions.proof(),
      receive: Permissions.none(),
      setPermissions: Permissions.proof(),
      setDelegate: Permissions.proof(),
      setTiming: Permissions.proof(),
      access: Permissions.none(),
    };
  }

  /**
   * 场景2: 高风险 - 将 send 权限设为 Impossible (不可逆)
   * 这会导致账户资金永久锁定，无法发送
   */
  @method async lockSendPermission() {
    this.account.permissions.set({
      ...this.getBasePermissions(),
      send: Permissions.impossible(),
    });
  }

  /**
   * 场景3: 高风险 - 将 receive 权限设为 Impossible (不可逆)
   * 这会导致账户无法接收任何资金
   */
  @method async lockReceivePermission() {
    this.account.permissions.set({
      ...this.getBasePermissions(),
      receive: Permissions.impossible(),
    });
  }

  /**
   * 场景4: 高风险 - 锁定所有权限修改能力 (不可逆)
   * setPermissions 设为 Impossible，之后无法再修改任何权限
   */
  @method async lockAllPermissions() {
    this.account.permissions.set({
      ...this.getBasePermissions(),
      setPermissions: Permissions.impossible(),
    });
  }

  /**
   * 场景5: 中风险 - 修改权限为 signature (可还原)
   * 从 proof 改为 signature，降低安全性
   */
  @method async weakenPermissions() {
    this.account.permissions.set({
      ...this.getBasePermissions(),
      editState: Permissions.signature(),
      send: Permissions.signature(),
    });
  }

  /**
   * 还原: 恢复权限为 proof (还原 weakenPermissions)
   */
  @method async restorePermissions() {
    this.account.permissions.set(this.getBasePermissions());
  }

  /**
   * 场景6: 中风险 - 修改委托
   * 改变账户的 staking 委托目标
   */
  @method async changeDelegation(newDelegate: PublicKey) {
    this.account.delegate.set(newDelegate);
  }

  /**
   * 场景7: 高风险 - 设置时间锁 (Timing/Vesting)
   * 这会锁定账户资金直到指定时间
   */
  @method async setTimingLock(
    initialBalance: UInt64,
    cliffTime: UInt32,
    cliffAmount: UInt64,
    vestingPeriod: UInt32,
    vestingIncrement: UInt64
  ) {
    this.account.timing.set({
      initialMinimumBalance: initialBalance,
      cliffTime: cliffTime,
      cliffAmount: cliffAmount,
      vestingPeriod: vestingPeriod,
      vestingIncrement: vestingIncrement,
    });
  }

  /**
   * 场景8: 中风险 - 修改验证密钥设置权限 (可还原)
   */
  @method async changeVerificationKeyPermission() {
    this.account.permissions.set({
      ...this.getBasePermissions(),
      setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
    });
  }

  /**
   * 还原: 恢复 VK 权限为默认
   */
  @method async restoreVerificationKeyPermission() {
    this.account.permissions.set({
      ...this.getBasePermissions(),
      setVerificationKey: Permissions.VerificationKey.impossibleDuringCurrentVersion(),
    });
  }

  /**
   * 场景9: 从合约发送资金 (测试 token flow)
   */
  @method async sendFunds(recipient: PublicKey, amount: UInt64) {
    this.send({ to: recipient, amount });
  }

  /**
   * 场景10: 接收资金到合约 (测试 token flow)
   */
  @method async receiveFunds(amount: UInt64) {
    const sender = this.sender.getAndRequireSignature();
    const senderUpdate = AccountUpdate.createSigned(sender);
    senderUpdate.send({ to: this.address, amount });
  }

  /**
   * 场景11: 复合风险 - 同时执行多个风险操作 (综合高风险, 不可逆)
   * 包含: 2个高风险 + 1个中风险
   * - 高风险1: send=impossible (锁定发送)
   * - 高风险2: receive=impossible (锁定接收)
   * - 中风险: editState=signature (降低安全等级)
   */
  @method async multipleRiskActions() {
    this.account.permissions.set({
      ...this.getBasePermissions(),
      send: Permissions.impossible(),      // 高风险: 锁定发送
      receive: Permissions.impossible(),   // 高风险: 锁定接收
      editState: Permissions.signature(),  // 中风险: 降低安全等级
    });
  }

  /**
   * 还原: 恢复场景11的权限设置
   */
  @method async restoreMultipleRiskActions() {
    this.account.permissions.set(this.getBasePermissions());
  }

  /**
   * 场景12: 高风险 - 将 access 权限设为 Impossible (不可逆)
   */
  @method async lockAccessPermission() {
    this.account.permissions.set({
      ...this.getBasePermissions(),
      access: Permissions.impossible(),
    });
  }

  /**
   * 获取当前值
   */
  getValue(): Field {
    return this.value.get();
  }
}

/**
 * TokenFlowTestContract - 代币流向测试合约
 * 用于测试钱包的代币流向分析功能
 */
export class TokenFlowTestContract extends SmartContract {
  @state(Field) totalReceived = State<Field>();
  @state(Field) totalSent = State<Field>();

  init() {
    super.init();
    this.totalReceived.set(Field(0));
    this.totalSent.set(Field(0));
    this.account.permissions.set({
      ...Permissions.default(),
      send: Permissions.proof(),
    });
  }

  /**
   * 多地址发送 - 测试 token flow 汇总
   */
  @method async multiSend(
    recipient1: PublicKey,
    amount1: UInt64,
    recipient2: PublicKey,
    amount2: UInt64,
    recipient3: PublicKey,
    amount3: UInt64
  ) {
    const zero = UInt64.from(0);
    
    const actualAmount1 = Provable.if(amount1.greaterThan(zero), amount1, zero);
    this.send({ to: recipient1, amount: actualAmount1 });

    const actualAmount2 = Provable.if(amount2.greaterThan(zero), amount2, zero);
    this.send({ to: recipient2, amount: actualAmount2 });

    const actualAmount3 = Provable.if(amount3.greaterThan(zero), amount3, zero);
    this.send({ to: recipient3, amount: actualAmount3 });
  }

  /**
   * 存入资金
   */
  @method async deposit(amount: UInt64) {
    const sender = this.sender.getAndRequireSignature();
    const senderUpdate = AccountUpdate.createSigned(sender);
    senderUpdate.send({ to: this.address, amount });
  }

  /**
   * 提取资金
   */
  @method async withdraw(amount: UInt64) {
    const sender = this.sender.getAndRequireSignature();
    this.send({ to: sender, amount });
  }
}
