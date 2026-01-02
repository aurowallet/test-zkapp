var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { SmartContract, method, PublicKey, UInt64, AccountUpdate, Permissions, Provable, Struct } from 'o1js';

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

    async batchTransfer(recipient1, amount1, recipient2, amount2, recipient3, amount3, recipient4, amount4, recipient5, amount5, recipient6, amount6, recipient7, amount7, recipient8, amount8) {
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

    async transfer(recipient, amount) {
        this.send({ to: recipient, amount });
    }

    async deposit(amount) {
        const sender = this.sender.getAndRequireSignature();
        const senderUpdate = AccountUpdate.createSigned(sender);
        senderUpdate.send({ to: this.address, amount });
    }

    getBalance() {
        return this.account.balance.get();
    }
}
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PublicKey, UInt64, PublicKey, UInt64, PublicKey, UInt64, PublicKey, UInt64, PublicKey, UInt64, PublicKey, UInt64, PublicKey, UInt64, PublicKey, UInt64]),
    __metadata("design:returntype", Promise)
], BatchTransfer.prototype, "batchTransfer", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PublicKey, UInt64]),
    __metadata("design:returntype", Promise)
], BatchTransfer.prototype, "transfer", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UInt64]),
    __metadata("design:returntype", Promise)
], BatchTransfer.prototype, "deposit", null);
