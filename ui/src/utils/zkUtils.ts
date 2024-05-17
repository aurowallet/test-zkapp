import { Field, Mina, PublicKey, UInt64 } from "o1js";
type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;
export function serializeTransaction(tx: Transaction) {
  const length = tx.transaction.accountUpdates.length;
  let i: number;
  let blindingValues: string[] = [];
  for (i = 0; i < length; i++) {
    const la = tx.transaction.accountUpdates[i].lazyAuthorization;
    if (
      la !== undefined &&
      (la as any).blindingValue !== undefined &&
      (la as any).kind === "lazy-proof"
    )
      blindingValues.push(((la as any).blindingValue as Field).toJSON());
    else blindingValues.push("");
  }

  const serializedTransaction: string = JSON.stringify(
    {
      tx: tx.toJSON(),
      blindingValues,
      length,
      fee: tx.transaction.feePayer.body.fee.toJSON(),
      sender: tx.transaction.feePayer.body.publicKey.toBase58(),
      nonce: tx.transaction.feePayer.body.nonce.toBigint().toString(),
    },
    null,
    2
  );
  return serializedTransaction;
}

export function transactionParams(serializedTransaction: string): {
  fee: UInt64;
  sender: PublicKey;
  nonce: number;
} {
  const { fee, sender, nonce } = JSON.parse(serializedTransaction);
  return {
    fee: UInt64.fromJSON(fee),
    sender: PublicKey.fromBase58(sender),
    nonce: Number(nonce),
  };
}

export function deserializeTransaction(
  serializedTransaction: string,
  txNew: Transaction,
  isReplaceFeePayer?: boolean,
  signedData?: string
): Transaction {
  const { tx, blindingValues, length } = JSON.parse(serializedTransaction);
  let parsedTx = JSON.parse(tx);

  if (isReplaceFeePayer) {
    const parsedZkCommond = JSON.parse(signedData!);
    parsedTx.feePayer = parsedZkCommond.zkappCommand.feePayer;
  }
  const transaction = Mina.Transaction.fromJSON(parsedTx) as Mina.Transaction<
    false,
    false
  >;
  if (length !== txNew.transaction.accountUpdates.length) {
    throw new Error("New Transaction length mismatch");
  }
  if (length !== transaction.transaction.accountUpdates.length) {
    throw new Error("Serialized Transaction length mismatch");
  }
  for (let i = 0; i < length; i++) {
    transaction.transaction.accountUpdates[i].lazyAuthorization =
      txNew.transaction.accountUpdates[i].lazyAuthorization;
    if (blindingValues[i] !== "")
      (
        transaction.transaction.accountUpdates[i].lazyAuthorization as any
      ).blindingValue = Field.fromJSON(blindingValues[i]);
  }
  return transaction;
}
export function transactionParamsV2(serializedTransaction: string): {
  fee: UInt64;
  sender: PublicKey;
  nonce: number;
} {
  const parsedZkCommond = JSON.parse(serializedTransaction);
  const { publicKey, nonce, fee } = parsedZkCommond.zkappCommand.feePayer.body;
  return {
    fee: UInt64.fromJSON(fee),
    sender: PublicKey.fromBase58(publicKey),
    nonce: Number(nonce),
  };
}
