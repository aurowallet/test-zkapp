var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { SmartContract, method, PublicKey, UInt64, UInt32, AccountUpdate, Permissions, state, State, Field, Provable } from 'o1js';

export class RiskTestContract extends SmartContract {
    constructor() {
        super(...arguments);
        this.value = State();
    }

    init() {
        super.init();
        this.value.set(Field(0));
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

    async safeUpdate(newValue) {
        this.value.set(newValue);
    }

    getBasePermissions() {
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

    async lockSendPermission() {
        this.account.permissions.set({
            ...this.getBasePermissions(),
            send: Permissions.impossible(),
        });
    }

    async lockReceivePermission() {
        this.account.permissions.set({
            ...this.getBasePermissions(),
            receive: Permissions.impossible(),
        });
    }

    async lockAllPermissions() {
        this.account.permissions.set({
            ...this.getBasePermissions(),
            setPermissions: Permissions.impossible(),
        });
    }

    async weakenPermissions() {
        this.account.permissions.set({
            ...this.getBasePermissions(),
            editState: Permissions.signature(),
            send: Permissions.signature(),
        });
    }

    async restorePermissions() {
        this.account.permissions.set(this.getBasePermissions());
    }

    async changeDelegation(newDelegate) {
        this.account.delegate.set(newDelegate);
    }

    async setTimingLock(initialBalance, cliffTime, cliffAmount, vestingPeriod, vestingIncrement) {
        this.account.timing.set({
            initialMinimumBalance: initialBalance,
            cliffTime: cliffTime,
            cliffAmount: cliffAmount,
            vestingPeriod: vestingPeriod,
            vestingIncrement: vestingIncrement,
        });
    }

    async changeVerificationKeyPermission() {
        this.account.permissions.set({
            ...this.getBasePermissions(),
            setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
        });
    }

    async restoreVerificationKeyPermission() {
        this.account.permissions.set({
            ...this.getBasePermissions(),
            setVerificationKey: Permissions.VerificationKey.impossibleDuringCurrentVersion(),
        });
    }

    async sendFunds(recipient, amount) {
        this.send({ to: recipient, amount });
    }

    async receiveFunds(amount) {
        const sender = this.sender.getAndRequireSignature();
        const senderUpdate = AccountUpdate.createSigned(sender);
        senderUpdate.send({ to: this.address, amount });
    }

    async multipleRiskActions() {
        this.account.permissions.set({
            ...this.getBasePermissions(),
            send: Permissions.impossible(),
            receive: Permissions.impossible(),
            editState: Permissions.signature(),
        });
    }

    async lockAccessPermission() {
        this.account.permissions.set({
            ...this.getBasePermissions(),
            access: Permissions.impossible(),
        });
    }

    getValue() {
        return this.value.get();
    }
}
__decorate([
    state(Field),
    __metadata("design:type", Object)
], RiskTestContract.prototype, "value", void 0);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Field]),
    __metadata("design:returntype", Promise)
], RiskTestContract.prototype, "safeUpdate", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RiskTestContract.prototype, "lockSendPermission", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RiskTestContract.prototype, "lockReceivePermission", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RiskTestContract.prototype, "lockAllPermissions", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RiskTestContract.prototype, "weakenPermissions", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RiskTestContract.prototype, "restorePermissions", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PublicKey]),
    __metadata("design:returntype", Promise)
], RiskTestContract.prototype, "changeDelegation", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UInt64, UInt32, UInt64, UInt32, UInt64]),
    __metadata("design:returntype", Promise)
], RiskTestContract.prototype, "setTimingLock", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RiskTestContract.prototype, "changeVerificationKeyPermission", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RiskTestContract.prototype, "restoreVerificationKeyPermission", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PublicKey, UInt64]),
    __metadata("design:returntype", Promise)
], RiskTestContract.prototype, "sendFunds", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UInt64]),
    __metadata("design:returntype", Promise)
], RiskTestContract.prototype, "receiveFunds", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RiskTestContract.prototype, "multipleRiskActions", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RiskTestContract.prototype, "lockAccessPermission", null);

export class TokenFlowTestContract extends SmartContract {
    constructor() {
        super(...arguments);
        this.totalReceived = State();
        this.totalSent = State();
    }

    init() {
        super.init();
        this.totalReceived.set(Field(0));
        this.totalSent.set(Field(0));
        this.account.permissions.set({
            ...Permissions.default(),
            send: Permissions.proof(),
        });
    }

    async multiSend(recipient1, amount1, recipient2, amount2, recipient3, amount3) {
        const zero = UInt64.from(0);
        
        const actualAmount1 = Provable.if(amount1.greaterThan(zero), amount1, zero);
        this.send({ to: recipient1, amount: actualAmount1 });

        const actualAmount2 = Provable.if(amount2.greaterThan(zero), amount2, zero);
        this.send({ to: recipient2, amount: actualAmount2 });

        const actualAmount3 = Provable.if(amount3.greaterThan(zero), amount3, zero);
        this.send({ to: recipient3, amount: actualAmount3 });
    }

    async deposit(amount) {
        const sender = this.sender.getAndRequireSignature();
        const senderUpdate = AccountUpdate.createSigned(sender);
        senderUpdate.send({ to: this.address, amount });
    }

    async withdraw(amount) {
        const sender = this.sender.getAndRequireSignature();
        this.send({ to: sender, amount });
    }
}
__decorate([
    state(Field),
    __metadata("design:type", Object)
], TokenFlowTestContract.prototype, "totalReceived", void 0);
__decorate([
    state(Field),
    __metadata("design:type", Object)
], TokenFlowTestContract.prototype, "totalSent", void 0);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PublicKey, UInt64, PublicKey, UInt64, PublicKey, UInt64]),
    __metadata("design:returntype", Promise)
], TokenFlowTestContract.prototype, "multiSend", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UInt64]),
    __metadata("design:returntype", Promise)
], TokenFlowTestContract.prototype, "deposit", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UInt64]),
    __metadata("design:returntype", Promise)
], TokenFlowTestContract.prototype, "withdraw", null);
