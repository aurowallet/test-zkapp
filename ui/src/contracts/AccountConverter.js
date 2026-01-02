var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { SmartContract, method, PublicKey, AccountUpdate, Permissions } from 'o1js';

export class AccountConverter extends SmartContract {
    init() {
        super.init();
        this.account.permissions.set({
            ...Permissions.default(),
            editState: Permissions.proof(),
            send: Permissions.proof(),
            receive: Permissions.none(),
            setPermissions: Permissions.proof(),
            setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
            setZkappUri: Permissions.proof(),
            editActionState: Permissions.proof(),
            setTokenSymbol: Permissions.proof(),
            incrementNonce: Permissions.proof(),
            setVotingFor: Permissions.proof(),
            setTiming: Permissions.proof(),
        });
    }

    async verifyConversion() {
        const zkappAccount = this.account.isNew.getAndRequireEquals();
    }

    async setProofPermissions() {
        this.account.permissions.set({
            ...Permissions.default(),
            editState: Permissions.proof(),
            send: Permissions.proof(),
            setPermissions: Permissions.proof(),
        });
    }

    async setSignaturePermissions() {
        this.account.permissions.set({
            ...Permissions.default(),
            editState: Permissions.signature(),
            send: Permissions.signature(),
            setPermissions: Permissions.proof(),
        });
    }

    async getAccountInfo() {
        this.account.balance.getAndRequireEquals();
    }
}
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccountConverter.prototype, "verifyConversion", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccountConverter.prototype, "setProofPermissions", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccountConverter.prototype, "setSignaturePermissions", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccountConverter.prototype, "getAccountInfo", null);

export class AccountConverterHelper {
    static async createConversionUpdate(targetAddress, verificationKey) {
        const accountUpdate = AccountUpdate.create(targetAddress);
        accountUpdate.account.verificationKey.set(verificationKey);
        accountUpdate.account.permissions.set({
            ...Permissions.default(),
            editState: Permissions.proof(),
            send: Permissions.proof(),
            receive: Permissions.none(),
            setPermissions: Permissions.proof(),
            setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
        });
        return accountUpdate;
    }
}
