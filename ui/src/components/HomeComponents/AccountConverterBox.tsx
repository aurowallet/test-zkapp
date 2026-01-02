import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { ChainInfoArgs, ProviderError, SendZkTransactionResult } from "@aurowallet/mina-provider";
import { useCallback, useMemo, useState } from "react";

// Dynamic import helper for o1js
const getO1js = async () => {
  const o1js = await import("o1js");
  return o1js;
};

// Module-level cache for compiled contract
let compiledAccountConverterContract: any = null;

import styled from "styled-components";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";
import { useMinaProvider } from "@/context/MinaProviderContext";
import { useTranslation } from "@/context/LanguageContext";
import toast from "react-hot-toast";

const StyledNote = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
  line-height: 1.5;
`;

const StyledFeatureList = styled.ul`
  font-size: 12px;
  color: #333;
  margin: 10px 0;
  padding-left: 20px;
  li {
    margin-bottom: 4px;
  }
`;

const ModeSelector = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const ModeButton = styled.button<{ $active: boolean; $riskLevel: 'high' | 'medium' | 'safe' }>`
  flex: 1;
  min-width: 120px;
  padding: 8px 12px;
  border: 2px solid ${props => 
    props.$riskLevel === 'high' ? '#dc3545' : 
    props.$riskLevel === 'medium' ? '#ffc107' : '#28a745'};
  background-color: ${props => props.$active ? 
    (props.$riskLevel === 'high' ? '#dc3545' : 
     props.$riskLevel === 'medium' ? '#ffc107' : '#28a745') : 'white'};
  color: ${props => props.$active ? 
    (props.$riskLevel === 'medium' ? '#333' : 'white') : '#333'};
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.85;
  }
`;

const RiskBadge = styled.span<{ $riskLevel: 'high' | 'medium' | 'safe' }>`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  margin-left: 4px;
  background-color: ${props => 
    props.$riskLevel === 'high' ? '#dc3545' : 
    props.$riskLevel === 'medium' ? '#ffc107' : '#28a745'};
  color: ${props => props.$riskLevel === 'medium' ? '#333' : 'white'};
`;

type ConversionMode = 'wallet' | 'new';

export const AccountConverterBox = ({
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
  const [displayText, setDisplayText] = useState("");
  const [txHash, setTxHash] = useState("");
  const [createText, setCreateText] = useState("");
  const [createHash, setCreateHash] = useState("");
  const [keys, setKeys] = useState({ publicKey: "", privateKey: "" });
  const [conversionMode, setConversionMode] = useState<ConversionMode>('new');

  const onChangeGqlUrl = useCallback((e: any) => setGqlUrl(e.target.value), []);
  const onChangeContractAddress = useCallback((e: any) => setContractAddress(e.target.value), []);

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
    if (compiledAccountConverterContract) return compiledAccountConverterContract;
    
    setDisplayText("Loading AccountConverter contract...");
    const AccountConverterModule = await import("@/contracts/AccountConverter") as any;
    // Handle both named export and default export
    const AccountConverter = AccountConverterModule.AccountConverter ?? AccountConverterModule.default;
    
    setDisplayText("Compiling contract (this may take a while)...");
    await AccountConverter.compile();
    
    // Cache the compiled contract
    compiledAccountConverterContract = AccountConverter;
    setDisplayText("Contract compiled!");
    return AccountConverter;
  }, []);

  const setupNetwork = useCallback(async () => {
    const { Mina } = await getO1js();
    const networkInstance = Mina.Network({
      networkId: network.networkID === "mina:mainnet" ? "mainnet" : "testnet",
      mina: gqlUrl,
    });
    Mina.setActiveInstance(networkInstance);
  }, [gqlUrl, network]);

  // Mode: new - Deploy new address as zkApp (safe)
  const onClickDeployNew = useCallback(async () => {
    if (!keys.privateKey) {
      toast.error("请先生成合约密钥");
      return;
    }
    
    try {
      setCreateHash("");
      setCreateText("Initializing...");
      
      const { PrivateKey, PublicKey, Mina, AccountUpdate, fetchAccount } = await getO1js();
      
      await setupNetwork();
      const AccountConverter = await compileContract();
      
      const zkAppPrivateKey = PrivateKey.fromBase58(keys.privateKey);
      const zkAppAddress = PublicKey.fromBase58(keys.publicKey);
      const zkApp = new AccountConverter(zkAppAddress);
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
        feePayer: { memo: "Deploy New zkApp" },
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

  // Mode: wallet - Convert wallet address to zkApp (high risk)
  const onClickConvertWallet = useCallback(async () => {
    if (!currentAccount) {
      toast.error("请先连接钱包");
      return;
    }
    
    try {
      setCreateHash("");
      setCreateText("Initializing...\n⚠️ 高风险操作: 将钱包地址转换为合约账户!");
      
      const { PublicKey, Mina, fetchAccount } = await getO1js();
      
      await setupNetwork();
      const AccountConverter = await compileContract();
      
      const zkAppAddress = PublicKey.fromBase58(currentAccount);
      const zkApp = new AccountConverter(zkAppAddress);
      const feePayerPublicKey = zkAppAddress; // Same as wallet address
      
      await fetchAccount({ publicKey: feePayerPublicKey });
      
      setCreateText("Building deploy transaction...\n⚠️ 高风险: 您的钱包地址将变为合约账户!");
      const txn = await Mina.transaction(feePayerPublicKey, async () => {
        await zkApp.deploy();
      });
      
      setCreateText("Proving transaction...");
      await txn.prove();
      // Note: wallet will sign both feePayer and zkApp account update
      
      setCreateText("Waiting for wallet confirmation...\n⚠️ 高风险操作! 请仔细查看钱包提示!");
      const txJSON = txn.toJSON();
      
      const res = await provider?.sendTransaction({
        transaction: txJSON,
        feePayer: { memo: "Convert Wallet to zkApp" },
      }).catch((err: any) => err);
      
      if ((res as ProviderError)?.code) {
        setCreateHash((res as ProviderError).message);
      } else {
        setCreateHash(JSON.stringify(res));
        setContractAddress(currentAccount);
      }
      setCreateText("");
    } catch (error: any) {
      setCreateText("");
      setCreateHash(`Error: ${error.message}`);
    }
  }, [currentAccount, setupNetwork, compileContract, provider]);

  // Query-based verification - no transaction needed
  const onClickCheckAccount = useCallback(async () => {
    if (!contractAddress) {
      toast.error("请输入要查询的地址");
      return;
    }
    try {
      setTxHash("");
      setDisplayText("正在查询账户信息...");
      
      const { PublicKey, fetchAccount } = await getO1js();
      
      await setupNetwork();
      
      const targetAddress = PublicKey.fromBase58(contractAddress);
      const accountResult = await fetchAccount({ publicKey: targetAddress });
      
      if (accountResult.account) {
        const account = accountResult.account;
        const isZkApp = !!account.zkapp;
        const hasVerificationKey = !!account.zkapp?.verificationKey;
        
        const info = {
          地址: contractAddress,
          余额: `${Number(account.balance.toString()) / 1e9} MINA`,
          是否为zkApp账户: isZkApp ? '✅ 是' : '❌ 否',
          是否有验证密钥: hasVerificationKey ? '✅ 是' : '❌ 否',
          账户状态: isZkApp ? '已转换为合约账户' : '普通账户',
        };
        setTxHash(JSON.stringify(info, null, 2));
      } else {
        setTxHash("账户不存在或未激活");
      }
      setDisplayText("");
    } catch (error: any) {
      setDisplayText("");
      setTxHash(`Error: ${error.message}`);
    }
  }, [contractAddress, setupNetwork]);

  const keysContent = useMemo(() => {
    return keys.privateKey ? JSON.stringify(keys, null, 2) : "";
  }, [keys]);

  return (
    <Box>
      <StyledBoxTitle>Account Converter Contract</StyledBoxTitle>
      <StyledNote>
        {t.accountConverter.description}
      </StyledNote>
      
      <Input placeholder={t.accountConverter.inputGraphQLUrl} onChange={onChangeGqlUrl} />
      <StyledDividedLine />
      
      {/* Mode Selection */}
      <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 14 }}>{t.accountConverter.selectMode}</div>
      <ModeSelector>
        <ModeButton 
          $active={conversionMode === 'new'} 
          $riskLevel="safe"
          onClick={() => setConversionMode('new')}
        >
          {t.accountConverter.newAddressDeploy}
          <RiskBadge $riskLevel="safe">{t.accountConverter.noRisk}</RiskBadge>
        </ModeButton>
        <ModeButton 
          $active={conversionMode === 'wallet'} 
          $riskLevel="high"
          onClick={() => setConversionMode('wallet')}
        >
          {t.accountConverter.convertWalletAddress}
          <RiskBadge $riskLevel="high">{t.accountConverter.highRisk}</RiskBadge>
        </ModeButton>
      </ModeSelector>
      
      {/* Mode: new - Deploy new address as zkApp (safe) */}
      {conversionMode === 'new' && (
        <>
          <StyledNote>{t.accountConverter.newModeDescription}</StyledNote>
          <Button onClick={onClickCreateKey}>{t.accountConverter.generateContractKeys}</Button>
          <InfoRow title={`${t.accountConverter.contractKeys}:`} type={InfoType.secondary}>
            {keysContent && <div style={{ fontSize: 12, wordBreak: 'break-all' }}>{keysContent}</div>}
          </InfoRow>
          <Button 
            checkConnection={true} 
            disabled={!gqlUrl || !keys.publicKey}
            onClick={onClickDeployNew}
          >
            {t.accountConverter.deployContract}
          </Button>
        </>
      )}
      
      {/* Mode: wallet - Convert wallet address to zkApp (high risk) */}
      {conversionMode === 'wallet' && (
        <>
          <StyledNote style={{ color: '#dc3545' }}>
            ⚠️ <strong>{t.accountConverter.highRisk}</strong>: {t.accountConverter.walletModeDescription}
            <br />
            {t.accountConverter.walletModeWarning}
          </StyledNote>
          <StyledNote>
            {t.accountConverter.currentWalletAddress}: <strong>{currentAccount || t.accountConverter.notConnected}</strong>
          </StyledNote>
          <Button 
            checkConnection={true} 
            disabled={!gqlUrl || !currentAccount}
            onClick={onClickConvertWallet}
          >
            {t.accountConverter.convertWalletToContract}
          </Button>
        </>
      )}
      
      <InfoRow title={`${t.accountConverter.deployResult}:`} content={createHash || createText} type={InfoType.secondary} />
      
      <StyledDividedLine />
      
      {/* Verification Section */}
      <Input 
        placeholder={t.accountConverter.contractAddress}
        value={contractAddress}
        onChange={onChangeContractAddress} 
      />
      
      <Button disabled={!contractAddress || !gqlUrl} onClick={onClickCheckAccount}>
        {t.accountConverter.queryAccountStatus}
      </Button>
      
      <InfoRow title={`${t.accountConverter.result}:`} content={txHash || displayText} type={InfoType.secondary} />
    </Box>
  );
};
