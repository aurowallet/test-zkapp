import {
  SmartContract,
  method,
  PublicKey,
  AccountUpdate,
  Permissions,
  VerificationKey,
} from 'o1js';

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

  @method async verifyConversion() {
    const zkappAccount = this.account.isNew.getAndRequireEquals();
  }

  @method async setProofPermissions() {
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proof(),
      send: Permissions.proof(),
      setPermissions: Permissions.proof(),
    });
  }

  @method async setSignaturePermissions() {
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.signature(),
      send: Permissions.signature(),
      setPermissions: Permissions.proof(),
    });
  }

  @method async getAccountInfo() {
    this.account.balance.getAndRequireEquals();
  }
}

export class AccountConverterHelper {
  static async createConversionUpdate(
    targetAddress: PublicKey,
    verificationKey: VerificationKey
  ): Promise<AccountUpdate> {
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
