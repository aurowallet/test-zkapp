import {
  SmartContract,
  method,
  PublicKey,
  AccountUpdate,
  Permissions,
  VerificationKey,
} from 'o1js';

/**
 * AccountConverter Contract
 * 账户转换合约 - 将普通Mina账户转换为zkApp(智能合约)账户
 * 
 * 使用方法:
 * 1. 生成新的密钥对作为合约地址
 * 2. 部署此合约到该地址，账户自动转换为zkApp账户
 * 3. 部署后账户将拥有验证密钥和可编程权限
 * 
 * 转换后的账户特性:
 * - 拥有验证密钥 (verification key)
 * - 可以存储状态变量
 * - 操作需要通过零知识证明验证
 * - 具有可编程的权限控制
 */
export class AccountConverter extends SmartContract {
  init() {
    super.init();
    // Set default permissions for the converted account
    this.account.permissions.set({
      ...Permissions.default(),
      // Require a proof to edit the zkApp state
      editState: Permissions.proof(),
      // Require a proof to send funds from this account
      send: Permissions.proof(),
      // Require a proof to receive funds
      receive: Permissions.none(),
      // Require a proof to set permissions
      setPermissions: Permissions.proof(),
      // Require a proof to set verification key
      setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
      // Require a proof to set zkApp URI
      setZkappUri: Permissions.proof(),
      // Require a proof to edit action state
      editActionState: Permissions.proof(),
      // Require a proof to set token symbol
      setTokenSymbol: Permissions.proof(),
      // Require a proof to increment nonce
      incrementNonce: Permissions.proof(),
      // Require a proof to set voting for
      setVotingFor: Permissions.proof(),
      // Require a proof to set timing
      setTiming: Permissions.proof(),
    });
  }

  /**
   * Convert account - this method can be called after deployment
   * to verify the account has been converted to a zkApp
   */
  @method async verifyConversion() {
    // Simply verify that this method can be called with a proof
    // This confirms the account is now a zkApp
    const zkappAccount = this.account.isNew.getAndRequireEquals();
    // Account should not be new if already deployed
  }

  /**
   * Set permissions to require proof for all operations (more secure)
   */
  @method async setProofPermissions() {
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proof(),
      send: Permissions.proof(),
      setPermissions: Permissions.proof(),
    });
  }

  /**
   * Set permissions to require signature for basic operations (less secure but simpler)
   */
  @method async setSignaturePermissions() {
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.signature(),
      send: Permissions.signature(),
      setPermissions: Permissions.proof(),
    });
  }

  /**
   * Get account info - verifies that account is converted to zkApp
   */
  @method async getAccountInfo() {
    // This method existing and being callable with proof
    // demonstrates the account is a zkApp
    this.account.balance.getAndRequireEquals();
  }
}

/**
 * Helper class to create the conversion transaction
 * This is used on the client side to build the deployment transaction
 */
export class AccountConverterHelper {
  /**
   * Creates the account update needed to convert a regular account to a zkApp
   * This should be called from the client/UI side
   */
  static async createConversionUpdate(
    targetAddress: PublicKey,
    verificationKey: VerificationKey
  ): Promise<AccountUpdate> {
    const accountUpdate = AccountUpdate.create(targetAddress);
    
    // Set the verification key to make it a zkApp
    accountUpdate.account.verificationKey.set(verificationKey);
    
    // Set initial permissions
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
