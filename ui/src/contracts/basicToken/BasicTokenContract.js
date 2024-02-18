var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { SmartContract, state, State, method, Permissions, UInt64, PublicKey, Signature, } from 'o1js';
const tokenSymbol = 'TESTTK';
export class BasicTokenContract extends SmartContract {
    constructor() {
        super(...arguments);
        this.totalAmountInCirculation = State();
    }
    deploy(args) {
        super.deploy(args);
        const permissionToEdit = Permissions.proof();
        this.account.permissions.set({
            ...Permissions.default(),
            editState: permissionToEdit,
            setTokenSymbol: permissionToEdit,
            send: permissionToEdit,
            receive: permissionToEdit,
        });
    }
    init() {
        super.init();
        this.account.tokenSymbol.set(tokenSymbol);
        this.totalAmountInCirculation.set(UInt64.zero);
    }
    mint(receiverAddress, amount, adminSignature) {
        let totalAmountInCirculation = this.totalAmountInCirculation.get();
        this.totalAmountInCirculation.requireEquals(totalAmountInCirculation);
        let newTotalAmountInCirculation = totalAmountInCirculation.add(amount);
        adminSignature
            .verify(this.address, amount.toFields().concat(receiverAddress.toFields()))
            .assertTrue();
        this.token.mint({
            address: receiverAddress,
            amount,
        });
        this.totalAmountInCirculation.set(newTotalAmountInCirculation);
    }
    sendTokens(senderAddress, receiverAddress, amount) {
        this.token.send({
            from: senderAddress,
            to: receiverAddress,
            amount,
        });
    }
}
__decorate([
    state(UInt64),
    __metadata("design:type", Object)
], BasicTokenContract.prototype, "totalAmountInCirculation", void 0);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BasicTokenContract.prototype, "init", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PublicKey,
        UInt64,
        Signature]),
    __metadata("design:returntype", void 0)
], BasicTokenContract.prototype, "mint", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PublicKey,
        PublicKey,
        UInt64]),
    __metadata("design:returntype", void 0)
], BasicTokenContract.prototype, "sendTokens", null);
//# sourceMappingURL=BasicTokenContract.js.map