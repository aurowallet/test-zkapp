import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { ChainInfoArgs, ProviderError } from "@aurowallet/mina-provider";
import { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";
import { useMinaProvider } from "@/context/MinaProviderContext";
import { useTranslation } from "@/context/LanguageContext";
import toast from "react-hot-toast";

// Dynamic import helper for o1js
const getO1js = async () => {
  const o1js = await import("o1js");
  return o1js;
};

// Module-level cache for compiled contract
let compiledRiskTestContract: any = null;

const StyledNote = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
  line-height: 1.5;
`;

const RiskButton = styled.button<{ $riskLevel: 'high' | 'medium' | 'safe' }>`
  background-color: ${props => 
    props.$riskLevel === 'high' ? '#dc3545' : 
    props.$riskLevel === 'medium' ? '#ffc107' : '#28a745'};
  color: ${props => props.$riskLevel === 'medium' ? '#333' : 'white'};
  display: block;
  text-align: center;
  cursor: pointer;
  font-weight: 400;
  font-size: 0.85rem;
  line-height: 1.5;
  border-radius: 0.3rem;
  border: 1px solid transparent;
  padding: 0.4rem 0.8rem;
  width: 100%;
  margin-bottom: 0.5rem;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RiskLabel = styled.span<{ $riskLevel: 'high' | 'medium' | 'safe' }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  margin-left: 8px;
  background-color: ${props => 
    props.$riskLevel === 'high' ? '#dc3545' : 
    props.$riskLevel === 'medium' ? '#ffc107' : '#28a745'};
  color: ${props => props.$riskLevel === 'medium' ? '#333' : 'white'};
`;

const SectionTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin: 12px 0 8px 0;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
`;

const ResultArea = styled.pre`
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-size: 11px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: stretch;
`;

const RestoreButton = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 11px;
  white-space: nowrap;
  
  &:hover {
    background: #5a6268;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const IrreversibleBadge = styled.span`
  display: inline-block;
  background: #6c757d;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  margin-left: auto;
  align-self: center;
`;

interface RiskAction {
  id: string;
  nameKey: string;
  descKey: string;
  riskLevel: 'high' | 'medium' | 'safe';
  method: string;
  canRestore: boolean;
  restoreMethod?: string;
}

const RISK_ACTIONS: RiskAction[] = [
  // High risk - may cause permanent fund lock or account unavailability (irreversible)
  { id: 'lockSend', nameKey: 'lockSend', descKey: 'lockSendDesc', riskLevel: 'high', method: 'lockSendPermission', canRestore: false },
  { id: 'lockReceive', nameKey: 'lockReceive', descKey: 'lockReceiveDesc', riskLevel: 'high', method: 'lockReceivePermission', canRestore: false },
  { id: 'lockAll', nameKey: 'lockAll', descKey: 'lockAllDesc', riskLevel: 'high', method: 'lockAllPermissions', canRestore: false },
  { id: 'lockAccess', nameKey: 'lockAccess', descKey: 'lockAccessDesc', riskLevel: 'high', method: 'lockAccessPermission', canRestore: false },
  { id: 'timing', nameKey: 'timing', descKey: 'timingDesc', riskLevel: 'high', method: 'setTimingLock', canRestore: false },
  { id: 'multiple', nameKey: 'multiple', descKey: 'multipleDesc', riskLevel: 'high', method: 'multipleRiskActions', canRestore: false },
  // Medium risk - reduce account security or modify via contract (reversible)
  { id: 'weaken', nameKey: 'weaken', descKey: 'weakenDesc', riskLevel: 'medium', method: 'weakenPermissions', canRestore: true, restoreMethod: 'restorePermissions' },
  { id: 'vkPerm', nameKey: 'vkPerm', descKey: 'vkPermDesc', riskLevel: 'medium', method: 'changeVerificationKeyPermission', canRestore: true, restoreMethod: 'restoreVerificationKeyPermission' },
  { id: 'delegate', nameKey: 'delegate', descKey: 'delegateDesc', riskLevel: 'medium', method: 'changeDelegation', canRestore: true, restoreMethod: 'changeDelegation' },
  // Safe - normal operations
  { id: 'safe', nameKey: 'safeUpdate', descKey: 'safeUpdateDesc', riskLevel: 'safe', method: 'safeUpdate', canRestore: false },
  { id: 'send', nameKey: 'sendFunds', descKey: 'sendFundsDesc', riskLevel: 'safe', method: 'sendFunds', canRestore: false },
  { id: 'receive', nameKey: 'receiveFunds', descKey: 'receiveFundsDesc', riskLevel: 'safe', method: 'receiveFunds', canRestore: false },
];

export const RiskTestBox = ({
  currentAccount,
  network,
}: {
  currentAccount: string;
  network: ChainInfoArgs;
}) => {
  const { provider } = useMinaProvider();
  const { t } = useTranslation();

  const [gqlUrl, setGqlUrl] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [delegateAddress, setDelegateAddress] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [txResult, setTxResult] = useState("");
  const [createText, setCreateText] = useState("");
  const [createHash, setCreateHash] = useState("");
  const [keys, setKeys] = useState({ publicKey: "", privateKey: "" });

  const onChangeGqlUrl = useCallback((e: any) => setGqlUrl(e.target.value), []);
  const onChangeContractAddress = useCallback((e: any) => setContractAddress(e.target.value), []);
  const onChangeDelegateAddress = useCallback((e: any) => setDelegateAddress(e.target.value), []);
  const onChangeRecipientAddress = useCallback((e: any) => setRecipientAddress(e.target.value), []);
  const onChangeAmount = useCallback((e: any) => setAmount(e.target.value), []);

  const onClickCreateKey = useCallback(async () => {
    const { PrivateKey, PublicKey } = await getO1js();
    const zkAppPrivateKey = PrivateKey.random();
    const zkAppAddress = zkAppPrivateKey.toPublicKey();
    setKeys({
      publicKey: PublicKey.toBase58(zkAppAddress),
      privateKey: PrivateKey.toBase58(zkAppPrivateKey),
    });
  }, []);

  const compileContract = useCallback(async () => {
    // Return cached contract if already compiled
    if (compiledRiskTestContract) return compiledRiskTestContract;
    
    setDisplayText("Loading RiskTestContract...");
    const RiskTestContractModule = await import("@/contracts/RiskTestContract") as any;
    // Handle both named export and default export
    const RiskTestContract = RiskTestContractModule.RiskTestContract ?? RiskTestContractModule.default;
    
    setDisplayText("Compiling contract (this may take a while)...");
    await RiskTestContract.compile();
    
    // Cache the compiled contract
    compiledRiskTestContract = RiskTestContract;
    setDisplayText("Contract compiled!");
    return RiskTestContract;
  }, []);

  const setupNetwork = useCallback(async () => {
    const { Mina } = await getO1js();
    const networkInstance = Mina.Network({
      networkId: network.networkID === "mina:mainnet" ? "mainnet" : "testnet",
      mina: gqlUrl,
    });
    Mina.setActiveInstance(networkInstance);
  }, [gqlUrl, network]);

  const onClickDeploy = useCallback(async () => {
    if (!currentAccount || !keys.privateKey) {
      toast.error("Please connect wallet and generate keys first");
      return;
    }
    try {
      setCreateHash("");
      setCreateText("Initializing...");
      
      const { PrivateKey, PublicKey, Mina, AccountUpdate, fetchAccount } = await getO1js();
      
      await setupNetwork();
      const RiskTestContract = await compileContract();
      
      const zkAppPrivateKey = PrivateKey.fromBase58(keys.privateKey);
      const zkAppAddress = PublicKey.fromBase58(keys.publicKey);
      const zkApp = new RiskTestContract(zkAppAddress);
      
      const feePayerPublicKey = PublicKey.fromBase58(currentAccount);
      await fetchAccount({ publicKey: feePayerPublicKey });
      
      setCreateText("Building deploy transaction...");
      const txn = await Mina.transaction(feePayerPublicKey, async () => {
        AccountUpdate.fundNewAccount(feePayerPublicKey);
        await zkApp.deploy();
      });
      
      setCreateText("Proving transaction...");
      await txn.prove();
      txn.sign([zkAppPrivateKey]);
      
      setCreateText("Waiting for wallet confirmation...");
      const txJSON = txn.toJSON();
      
      const res = await provider?.sendTransaction({
        transaction: txJSON,
        feePayer: { memo: "Deploy RiskTestContract" },
      }).catch((err: any) => err);
      
      if ((res as ProviderError)?.code) {
        setCreateHash((res as ProviderError).message);
      } else {
        setCreateHash(JSON.stringify(res));
        setContractAddress(keys.publicKey);
      }
      setCreateText("");
    } catch (error: any) {
      setCreateText("");
      setCreateHash(`Error: ${error.message}`);
    }
  }, [currentAccount, keys, setupNetwork, compileContract, provider]);

  const executeRiskAction = useCallback(async (action: RiskAction) => {
    if (!contractAddress) {
      toast.error("Please enter contract address");
      return;
    }
    
    try {
      setTxResult("");
      setDisplayText(`Preparing ${action.method}...`);
      
      const { PublicKey, Mina, fetchAccount, Field, UInt64, UInt32 } = await getO1js();
      
      await setupNetwork();
      const RiskTestContract = await compileContract();
      
      const zkAppAddress = PublicKey.fromBase58(contractAddress);
      const zkApp = new RiskTestContract(zkAppAddress);
      const feePayerPublicKey = PublicKey.fromBase58(currentAccount);
      
      await fetchAccount({ publicKey: feePayerPublicKey });
      await fetchAccount({ publicKey: zkAppAddress });
      
      setDisplayText(`Building ${action.method} transaction...`);
      
      let txn;
      switch (action.method) {
        case 'safeUpdate':
          txn = await Mina.transaction(feePayerPublicKey, async () => {
            await zkApp.safeUpdate(Field(Math.floor(Math.random() * 1000)));
          });
          break;
        case 'lockSendPermission':
          txn = await Mina.transaction(feePayerPublicKey, async () => {
            await zkApp.lockSendPermission();
          });
          break;
        case 'lockReceivePermission':
          txn = await Mina.transaction(feePayerPublicKey, async () => {
            await zkApp.lockReceivePermission();
          });
          break;
        case 'lockAllPermissions':
          txn = await Mina.transaction(feePayerPublicKey, async () => {
            await zkApp.lockAllPermissions();
          });
          break;
        case 'lockAccessPermission':
          txn = await Mina.transaction(feePayerPublicKey, async () => {
            await zkApp.lockAccessPermission();
          });
          break;
        case 'weakenPermissions':
          txn = await Mina.transaction(feePayerPublicKey, async () => {
            await zkApp.weakenPermissions();
          });
          break;
        case 'changeDelegation':
          if (!delegateAddress) {
            toast.error("Please enter delegate address");
            setDisplayText("");
            return;
          }
          txn = await Mina.transaction(feePayerPublicKey, async () => {
            await zkApp.changeDelegation(PublicKey.fromBase58(delegateAddress));
          });
          break;
        case 'setTimingLock':
          txn = await Mina.transaction(feePayerPublicKey, async () => {
            await zkApp.setTimingLock(
              UInt64.from(5_000_000_000),
              UInt32.from(1000),
              UInt64.from(1_000_000_000),
              UInt32.from(100),
              UInt64.from(500_000_000)
            );
          });
          break;
        case 'changeVerificationKeyPermission':
          txn = await Mina.transaction(feePayerPublicKey, async () => {
            await zkApp.changeVerificationKeyPermission();
          });
          break;
        case 'sendFunds':
          if (!recipientAddress || !amount) {
            toast.error("Please enter recipient address and amount");
            setDisplayText("");
            return;
          }
          txn = await Mina.transaction(feePayerPublicKey, async () => {
            await zkApp.sendFunds(
              PublicKey.fromBase58(recipientAddress),
              UInt64.from(Math.floor(parseFloat(amount) * 1e9))
            );
          });
          break;
        case 'receiveFunds':
          if (!amount) {
            toast.error("Please enter amount");
            setDisplayText("");
            return;
          }
          txn = await Mina.transaction(feePayerPublicKey, async () => {
            await zkApp.receiveFunds(UInt64.from(Math.floor(parseFloat(amount) * 1e9)));
          });
          break;
        case 'multipleRiskActions':
          txn = await Mina.transaction(feePayerPublicKey, async () => {
            await zkApp.multipleRiskActions();
          });
          break;
        case 'restorePermissions':
          txn = await Mina.transaction(feePayerPublicKey, async () => {
            await zkApp.restorePermissions();
          });
          break;
        case 'restoreVerificationKeyPermission':
          txn = await Mina.transaction(feePayerPublicKey, async () => {
            await zkApp.restoreVerificationKeyPermission();
          });
          break;
        default:
          toast.error("Unknown action");
          setDisplayText("");
          return;
      }
      
      setDisplayText("Proving transaction...");
      await txn.prove();
      
      setDisplayText("Waiting for wallet confirmation...\n⚠️ 请观察钱包的风险提示!");
      const txJSON = txn.toJSON();
      
      const res = await provider?.sendTransaction({
        transaction: txJSON,
        feePayer: { memo: `Risk Test: ${action.method}` },
      }).catch((err: any) => err);
      
      if ((res as ProviderError)?.code) {
        setTxResult(`Error: ${(res as ProviderError).message}`);
      } else {
        setTxResult(`Success: ${JSON.stringify(res)}`);
      }
      setDisplayText("");
    } catch (error: any) {
      setDisplayText("");
      setTxResult(`Error: ${error.message}`);
    }
  }, [contractAddress, delegateAddress, recipientAddress, amount, currentAccount, setupNetwork, compileContract, provider]);

  const keysContent = useMemo(() => {
    return keys.privateKey ? JSON.stringify(keys, null, 2) : "";
  }, [keys]);

  const highRiskActions = RISK_ACTIONS.filter(a => a.riskLevel === 'high');
  const mediumRiskActions = RISK_ACTIONS.filter(a => a.riskLevel === 'medium');
  const safeActions = RISK_ACTIONS.filter(a => a.riskLevel === 'safe');

  return (
    <Box>
      <StyledBoxTitle>Risk Test Contract</StyledBoxTitle>
      <StyledNote>
        {t.riskTest.description}
      </StyledNote>
      
      <Input placeholder={t.riskTest.inputGraphQLUrl} onChange={onChangeGqlUrl} />
      <StyledDividedLine />
      
      {/* Deploy Section */}
      <Button onClick={onClickCreateKey}>{t.riskTest.generateContractKeys}</Button>
      <InfoRow title={`${t.riskTest.contractKeys}:`} type={InfoType.secondary}>
        {keysContent && <div style={{ fontSize: 11, wordBreak: 'break-all' }}>{keysContent}</div>}
      </InfoRow>
      <Button 
        checkConnection={true} 
        disabled={!keys.publicKey || !gqlUrl}
        onClick={onClickDeploy}
      >
        {t.riskTest.deployContract}
      </Button>
      <InfoRow title={`${t.riskTest.deployResult}:`} content={createHash || createText} type={InfoType.secondary} />
      
      <StyledDividedLine />
      
      {/* Contract Address */}
      <Input 
        placeholder={t.riskTest.contractAddress}
        value={contractAddress}
        onChange={onChangeContractAddress} 
      />
      
      {/* Parameters for some actions */}
      <Input placeholder={t.riskTest.delegateAddress} onChange={onChangeDelegateAddress} />
      <Input placeholder={t.riskTest.recipientAddress} onChange={onChangeRecipientAddress} />
      <Input placeholder={t.riskTest.amountMina} onChange={onChangeAmount} />
      
      <StyledDividedLine />
      
      {/* High Risk Actions */}
      <SectionTitle>{t.riskTest.highRiskSection}</SectionTitle>
      {highRiskActions.map(action => (
        <ActionRow key={action.id}>
          <RiskButton
            $riskLevel="high"
            disabled={!contractAddress}
            onClick={() => executeRiskAction(action)}
            style={{ flex: 1, marginBottom: 0 }}
          >
            {(t.riskTest as any)[action.nameKey]}
            <RiskLabel $riskLevel="high">{t.riskTest.highRisk}</RiskLabel>
            <div style={{ fontSize: 10, opacity: 0.9 }}>{(t.riskTest as any)[action.descKey]}</div>
          </RiskButton>
          <IrreversibleBadge>{t.riskTest.irreversible}</IrreversibleBadge>
        </ActionRow>
      ))}
      
      {/* Medium Risk Actions */}
      <SectionTitle>{t.riskTest.mediumRiskSection}</SectionTitle>
      {mediumRiskActions.map(action => (
        <ActionRow key={action.id}>
          <RiskButton
            $riskLevel="medium"
            disabled={!contractAddress}
            onClick={() => executeRiskAction(action)}
            style={{ flex: 1, marginBottom: 0 }}
          >
            {(t.riskTest as any)[action.nameKey]}
            <RiskLabel $riskLevel="medium">{t.riskTest.mediumRisk}</RiskLabel>
            <div style={{ fontSize: 10 }}>{(t.riskTest as any)[action.descKey]}</div>
          </RiskButton>
          {action.canRestore && action.restoreMethod && (
            <RestoreButton
              disabled={!contractAddress}
              onClick={() => executeRiskAction({ ...action, method: action.restoreMethod! })}
            >
              {t.riskTest.restore}
            </RestoreButton>
          )}
        </ActionRow>
      ))}
      
      {/* Safe Actions */}
      <SectionTitle>{t.riskTest.safeSection}</SectionTitle>
      {safeActions.map(action => (
        <RiskButton
          key={action.id}
          $riskLevel="safe"
          disabled={!contractAddress}
          onClick={() => executeRiskAction(action)}
        >
          {(t.riskTest as any)[action.nameKey]}
          <RiskLabel $riskLevel="safe">{t.riskTest.safe}</RiskLabel>
          <div style={{ fontSize: 10, opacity: 0.9 }}>{(t.riskTest as any)[action.descKey]}</div>
        </RiskButton>
      ))}
      
      <StyledDividedLine />
      
      {/* Results */}
      {displayText && <StyledNote style={{ color: '#6b5dfb' }}>{displayText}</StyledNote>}
      {txResult && (
        <>
          <SectionTitle>{t.riskTest.transactionResult}</SectionTitle>
          <ResultArea>{txResult}</ResultArea>
        </>
      )}
    </Box>
  );
};
