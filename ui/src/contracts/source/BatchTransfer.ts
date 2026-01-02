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

  @method async transfer(recipient: PublicKey, amount: UInt64) {
    this.send({ to: recipient, amount });
  }

  @method async deposit(amount: UInt64) {
    const sender = this.sender.getAndRequireSignature();
    const senderUpdate = AccountUpdate.createSigned(sender);
    senderUpdate.send({ to: this.address, amount });
  }

  getBalance(): UInt64 {
    return this.account.balance.get();
  }
}
