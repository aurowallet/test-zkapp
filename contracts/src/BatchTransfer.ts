import {
  SmartContract,
  method,
  PublicKey,
  UInt64,
  AccountUpdate,
  Permissions,
  Provable,
  Struct,
} from 'o1js';

/**
 * BatchTransfer Contract
 * 批量转账合约 - 支持在单笔交易中向1-8个地址发送Mina
 * 
 * 使用方法:
 * 1. 部署合约到一个新地址
 * 2. 调用 deposit() 向合约存入资金
 * 3. 调用 batchTransfer() 进行批量转账，未使用的地址slot传入零地址和零金额
 * 
 * 示例:
 * - 转账给3个地址: batchTransfer(addr1, amt1, addr2, amt2, addr3, amt3, zeroAddr, 0, zeroAddr, 0, ...)
 * - 金额为0的地址将被跳过不执行转账
 */

export class TransferData extends Struct({
  to: PublicKey,
  amount: UInt64,
}) {}

export class BatchTransfer extends SmartContract {
  init() {
    super.init();
    this.account.permissions.set({
      ...Permissions.default(),
      send: Permissions.proof(),
    });
  }

  /**
   * 批量转账到多个接收者 (1-8个地址)
   * 对于不需要转账的slot，传入任意地址和金额0即可跳过
   * 
   * @param recipient1-8 接收者地址
   * @param amount1-8 转账金额 (nanomina), 金额为0则跳过该地址
   */
  @method async batchTransfer(
    recipient1: PublicKey,
    amount1: UInt64,
    recipient2: PublicKey,
    amount2: UInt64,
    recipient3: PublicKey,
    amount3: UInt64,
    recipient4: PublicKey,
    amount4: UInt64,
    recipient5: PublicKey,
    amount5: UInt64,
    recipient6: PublicKey,
    amount6: UInt64,
    recipient7: PublicKey,
    amount7: UInt64,
    recipient8: PublicKey,
    amount8: UInt64
  ) {
    const zero = UInt64.from(0);
    
    // 使用 Provable.if 进行电路兼容的条件转账
    // 金额为0时实际不会转账
    const actualAmount1 = Provable.if(amount1.greaterThan(zero), amount1, zero);
    this.send({ to: recipient1, amount: actualAmount1 });

    const actualAmount2 = Provable.if(amount2.greaterThan(zero), amount2, zero);
    this.send({ to: recipient2, amount: actualAmount2 });

    const actualAmount3 = Provable.if(amount3.greaterThan(zero), amount3, zero);
    this.send({ to: recipient3, amount: actualAmount3 });

    const actualAmount4 = Provable.if(amount4.greaterThan(zero), amount4, zero);
    this.send({ to: recipient4, amount: actualAmount4 });

    const actualAmount5 = Provable.if(amount5.greaterThan(zero), amount5, zero);
    this.send({ to: recipient5, amount: actualAmount5 });

    const actualAmount6 = Provable.if(amount6.greaterThan(zero), amount6, zero);
    this.send({ to: recipient6, amount: actualAmount6 });

    const actualAmount7 = Provable.if(amount7.greaterThan(zero), amount7, zero);
    this.send({ to: recipient7, amount: actualAmount7 });

    const actualAmount8 = Provable.if(amount8.greaterThan(zero), amount8, zero);
    this.send({ to: recipient8, amount: actualAmount8 });
  }

  /**
   * 单笔转账 (便捷方法)
   */
  @method async transfer(recipient: PublicKey, amount: UInt64) {
    this.send({ to: recipient, amount });
  }

  /**
   * 向合约存入资金
   * @param amount 存入金额 (nanomina)
   */
  @method async deposit(amount: UInt64) {
    const sender = this.sender.getAndRequireSignature();
    const senderUpdate = AccountUpdate.createSigned(sender);
    senderUpdate.send({ to: this.address, amount });
  }

  /**
   * 获取合约余额的辅助方法 (链下调用)
   */
  getBalance(): UInt64 {
    return this.account.balance.get();
  }
}
