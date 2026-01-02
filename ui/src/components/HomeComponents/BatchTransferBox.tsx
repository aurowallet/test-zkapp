import { Box, StyledBoxTitle, StyledDividedLine } from "@/styles/HomeStyles";
import { ChainInfoArgs, ProviderError, SendZkTransactionResult } from "@aurowallet/mina-provider";
import { useCallback, useEffect, useMemo, useState } from "react";

// Dynamic import helper for o1js
const getO1js = async () => {
  const o1js = await import("o1js");
  return o1js;
};

// Module-level cache for compiled contract
let compiledBatchTransferContract: any = null;

import styled from "styled-components";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { Input } from "../Input";
import { useMinaProvider } from "@/context/MinaProviderContext";
import { useTranslation } from "@/context/LanguageContext";
import toast from "react-hot-toast";

const StyledRecipientRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
`;

const StyledIndex = styled.span`
  min-width: 20px;
  font-weight: bold;
  color: #6b5dfb;
  font-size: 14px;
`;

const StyledAddressInput = styled(Input)`
  flex: 2;
  margin-bottom: 0;
`;

const StyledAmountInput = styled(Input)`
  flex: 1;
  max-width: 120px;
  margin-bottom: 0;
`;

const StyledNote = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
`;

interface Recipient {
  address: string;
  amount: string;
}

export const BatchTransferBox = ({
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
  const [recipients, setRecipients] = useState<Recipient[]>(
    Array(8).fill(null).map(() => ({ address: "", amount: "" }))
  );
  const [depositAmount, setDepositAmount] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [txHash, setTxHash] = useState("");
  const [createText, setCreateText] = useState("");
  const [createHash, setCreateHash] = useState("");
  const [keys, setKeys] = useState({ publicKey: "", privateKey: "" });

  const onChangeGqlUrl = useCallback((e: any) => setGqlUrl(e.target.value), []);
  const onChangeContractAddress = useCallback((e: any) => setContractAddress(e.target.value), []);
  const onChangeDepositAmount = useCallback((e: any) => setDepositAmount(e.target.value), []);

  const updateRecipient = useCallback((index: number, field: 'address' | 'amount', value: string) => {
    setRecipients(prev => {
      const newRecipients = [...prev];
      newRecipients[index] = { ...newRecipients[index], [field]: value };
      return newRecipients;
    });
  }, []);

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
    if (compiledBatchTransferContract) return compiledBatchTransferContract;
    
    setDisplayText("Loading BatchTransfer contract...");
    const BatchTransferModule = await import("@/contracts/BatchTransfer") as any;
    // Handle both named export and default export
    const BatchTransfer = BatchTransferModule.BatchTransfer ?? BatchTransferModule.default;
    
    setDisplayText("Compiling contract (this may take a while)...");
    await BatchTransfer.compile();
    
    // Cache the compiled contract
    compiledBatchTransferContract = BatchTransfer;
    setDisplayText("Contract compiled!");
    return BatchTransfer;
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
      const BatchTransfer = await compileContract();
      
      const zkAppPrivateKey = PrivateKey.fromBase58(keys.privateKey);
      const zkAppAddress = PublicKey.fromBase58(keys.publicKey);
      const zkApp = new BatchTransfer(zkAppAddress);
      
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
        feePayer: { memo: "Deploy BatchTransfer" },
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

  const onClickDeposit = useCallback(async () => {
    if (!contractAddress || !depositAmount) {
      toast.error("Please enter contract address and deposit amount");
      return;
    }
    try {
      setTxHash("");
      setDisplayText("Preparing deposit...");
      
      const { PublicKey, Mina, fetchAccount, UInt64 } = await getO1js();
      
      await setupNetwork();
      const BatchTransfer = await compileContract();
      
      const zkAppAddress = PublicKey.fromBase58(contractAddress);
      const zkApp = new BatchTransfer(zkAppAddress);
      const feePayerPublicKey = PublicKey.fromBase58(currentAccount);
      
      await fetchAccount({ publicKey: feePayerPublicKey });
      await fetchAccount({ publicKey: zkAppAddress });
      
      const amount = UInt64.from(Math.floor(parseFloat(depositAmount) * 1e9));
      
      setDisplayText("Building deposit transaction...");
      const txn = await Mina.transaction(feePayerPublicKey, async () => {
        await zkApp.deposit(amount);
      });
      
      setDisplayText("Proving transaction...");
      await txn.prove();
      
      setDisplayText("Waiting for wallet confirmation...");
      const txJSON = txn.toJSON();
      
      const res = await provider?.sendTransaction({
        transaction: txJSON,
        feePayer: { memo: "Deposit to BatchTransfer" },
      }).catch((err: any) => err);
      
      if ((res as ProviderError)?.code) {
        setTxHash((res as ProviderError).message);
      } else {
        setTxHash(JSON.stringify(res));
      }
      setDisplayText("");
    } catch (error: any) {
      setDisplayText("");
      setTxHash(`Error: ${error.message}`);
    }
  }, [contractAddress, depositAmount, currentAccount, setupNetwork, compileContract, provider]);

  const onClickBatchTransfer = useCallback(async () => {
    if (!contractAddress) {
      toast.error("Please enter contract address");
      return;
    }
    
    const validRecipients = recipients.filter(r => r.address && parseFloat(r.amount) > 0);
    if (validRecipients.length === 0) {
      toast.error("Please enter at least one recipient");
      return;
    }
    
    try {
      setTxHash("");
      setDisplayText("Preparing batch transfer...");
      
      const { PublicKey, Mina, fetchAccount, UInt64 } = await getO1js();
      
      await setupNetwork();
      const BatchTransfer = await compileContract();
      
      const zkAppAddress = PublicKey.fromBase58(contractAddress);
      const zkApp = new BatchTransfer(zkAppAddress);
      const feePayerPublicKey = PublicKey.fromBase58(currentAccount);
      
      await fetchAccount({ publicKey: feePayerPublicKey });
      await fetchAccount({ publicKey: zkAppAddress });
      
      // Prepare recipients (fill empty slots with zero address and zero amount)
      const zeroAddress = PublicKey.empty();
      const zeroAmount = UInt64.from(0);
      
      const recipientAddresses: any[] = [];
      const recipientAmounts: any[] = [];
      
      for (let i = 0; i < 8; i++) {
        if (recipients[i].address && parseFloat(recipients[i].amount) > 0) {
          recipientAddresses.push(PublicKey.fromBase58(recipients[i].address));
          recipientAmounts.push(UInt64.from(Math.floor(parseFloat(recipients[i].amount) * 1e9)));
        } else {
          recipientAddresses.push(zeroAddress);
          recipientAmounts.push(zeroAmount);
        }
      }
      
      setDisplayText("Building batch transfer transaction...");
      const txn = await Mina.transaction(feePayerPublicKey, async () => {
        await zkApp.batchTransfer(
          recipientAddresses[0], recipientAmounts[0],
          recipientAddresses[1], recipientAmounts[1],
          recipientAddresses[2], recipientAmounts[2],
          recipientAddresses[3], recipientAmounts[3],
          recipientAddresses[4], recipientAmounts[4],
          recipientAddresses[5], recipientAmounts[5],
          recipientAddresses[6], recipientAmounts[6],
          recipientAddresses[7], recipientAmounts[7]
        );
      });
      
      setDisplayText("Proving transaction (this may take a while)...");
      await txn.prove();
      
      setDisplayText("Waiting for wallet confirmation...");
      const txJSON = txn.toJSON();
      
      const res = await provider?.sendTransaction({
        transaction: txJSON,
        feePayer: { memo: "Batch Transfer" },
      }).catch((err: any) => err);
      
      if ((res as ProviderError)?.code) {
        setTxHash((res as ProviderError).message);
      } else {
        setTxHash(JSON.stringify(res));
      }
      setDisplayText("");
    } catch (error: any) {
      setDisplayText("");
      setTxHash(`Error: ${error.message}`);
    }
  }, [contractAddress, recipients, currentAccount, setupNetwork, compileContract, provider]);

  const keysContent = useMemo(() => {
    return keys.privateKey ? JSON.stringify(keys, null, 2) : "";
  }, [keys]);

  const activeRecipientCount = useMemo(() => {
    return recipients.filter(r => r.address && parseFloat(r.amount) > 0).length;
  }, [recipients]);

  return (
    <Box>
      <StyledBoxTitle>Batch Transfer Contract</StyledBoxTitle>
      <StyledNote>{t.batchTransfer.description}</StyledNote>
      
      <Input placeholder={t.batchTransfer.inputGraphQLUrl} onChange={onChangeGqlUrl} />
      <StyledDividedLine />
      
      {/* Deploy Section */}
      <Button onClick={onClickCreateKey}>{t.batchTransfer.generateKeys}</Button>
      <InfoRow title={`${t.batchTransfer.contractKeys}:`} type={InfoType.secondary}>
        {keysContent && <div style={{ fontSize: 12, wordBreak: 'break-all' }}>{keysContent}</div>}
      </InfoRow>
      <Button 
        checkConnection={true} 
        disabled={!keys.publicKey || !gqlUrl}
        onClick={onClickDeploy}
      >
        {t.batchTransfer.deployContract}
      </Button>
      <InfoRow title={`${t.batchTransfer.deployResult}:`} content={createHash || createText} type={InfoType.secondary} />
      
      <StyledDividedLine />
      
      {/* Contract Interaction Section */}
      <Input 
        placeholder={t.batchTransfer.contractAddress}
        value={contractAddress}
        onChange={onChangeContractAddress} 
      />
      
      {/* Deposit */}
      <Input placeholder={t.batchTransfer.depositAmount} onChange={onChangeDepositAmount} />
      <Button checkConnection={true} disabled={!contractAddress} onClick={onClickDeposit}>
        {t.batchTransfer.deposit}
      </Button>
      
      <StyledDividedLine />
      
      {/* Batch Transfer */}
      <StyledNote>{t.batchTransfer.batchTransfer}:</StyledNote>
      {recipients.map((recipient, index) => (
        <StyledRecipientRow key={index}>
          <StyledIndex>{index + 1}.</StyledIndex>
          <StyledAddressInput
            placeholder={`${t.batchTransfer.recipient} ${index + 1}`}
            value={recipient.address}
            onChange={(e: any) => updateRecipient(index, 'address', e.target.value)}
          />
          <StyledAmountInput
            placeholder={t.batchTransfer.amount}
            value={recipient.amount}
            onChange={(e: any) => updateRecipient(index, 'amount', e.target.value)}
          />
        </StyledRecipientRow>
      ))}
      <StyledNote>{activeRecipientCount} recipients</StyledNote>
      
      <Button 
        checkConnection={true} 
        disabled={!contractAddress || activeRecipientCount === 0}
        onClick={onClickBatchTransfer}
      >
        {t.batchTransfer.executeBatchTransfer}
      </Button>
      
      <InfoRow title={`${t.batchTransfer.transferResult}:`} content={txHash || displayText} type={InfoType.secondary} />
    </Box>
  );
};
