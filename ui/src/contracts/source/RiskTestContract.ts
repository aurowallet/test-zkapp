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
  Provable,
} from 'o1js';

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

  @method async safeUpdate(newValue: Field) {
    this.value.set(newValue);
  }

  @method async lockSendPermission() {
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proof(),
      send: Permissions.impossible(),
    });
  }

  @method async lockReceivePermission() {
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proof(),
      receive: Permissions.impossible(),
    });
  }

  @method async lockAllPermissions() {
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proof(),
      send: Permissions.proof(),
      setPermissions: Permissions.impossible(),
    });
  }

  @method async weakenPermissions() {
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.signature(),
      send: Permissions.signature(),
    });
  }

  @method async changeDelegation(newDelegate: PublicKey) {
    this.account.delegate.set(newDelegate);
  }

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

  @method async changeVerificationKeyPermission() {
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proof(),
      setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
    });
  }

  @method async sendFunds(recipient: PublicKey, amount: UInt64) {
    this.send({ to: recipient, amount });
  }

  @method async receiveFunds(amount: UInt64) {
    const sender = this.sender.getAndRequireSignature();
    const senderUpdate = AccountUpdate.createSigned(sender);
    senderUpdate.send({ to: this.address, amount });
  }

  @method async multipleRiskActions(newDelegate: PublicKey) {
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.signature(),
      send: Permissions.signature(),
      setPermissions: Permissions.impossible(),
    });
    this.account.delegate.set(newDelegate);
  }

  @method async lockAccessPermission() {
    this.account.permissions.set({
      ...Permissions.default(),
      access: Permissions.impossible(),
    });
  }

  getValue(): Field {
    return this.value.get();
  }
}

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

  @method async deposit(amount: UInt64) {
    const sender = this.sender.getAndRequireSignature();
    const senderUpdate = AccountUpdate.createSigned(sender);
    senderUpdate.send({ to: this.address, amount });
  }

  @method async withdraw(amount: UInt64) {
    const sender = this.sender.getAndRequireSignature();
    this.send({ to: sender, amount });
  }
}
