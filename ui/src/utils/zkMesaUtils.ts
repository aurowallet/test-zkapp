import { Field, Mina, PublicKey, UInt64 } from "o1js-mesa";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

export function serializeMesaTransaction(tx: Transaction) {
  const length = tx.transaction.accountUpdates.length;
  const blindingValues = tx.transaction.accountUpdates.map((accountUpdate) => {
    const authorization = accountUpdate.lazyAuthorization as any;
    return authorization?.kind === "lazy-proof" && authorization.blindingValue
      ? (authorization.blindingValue as Field).toJSON()
      : "";
  });
  return JSON.stringify({
    tx: tx.toJSON(),
    blindingValues,
    length,
    fee: tx.transaction.feePayer.body.fee.toJSON(),
    sender: tx.transaction.feePayer.body.publicKey.toBase58(),
    nonce: tx.transaction.feePayer.body.nonce.toBigint().toString(),
  });
}

export function mesaTransactionParams(serializedTransaction: string) {
  const { fee, sender, nonce } = JSON.parse(serializedTransaction);
  return {
    fee: UInt64.fromJSON(fee),
    sender: PublicKey.fromBase58(sender),
    nonce: Number(nonce),
  };
}

export function mesaSignedTransactionParams(signedData: string) {
  const command = JSON.parse(signedData).zkappCommand;
  const { publicKey, nonce, fee } = command.feePayer.body;
  return {
    fee: UInt64.fromJSON(fee),
    sender: PublicKey.fromBase58(publicKey),
    nonce: Number(nonce),
  };
}

export function deserializeMesaTransaction(
  serializedTransaction: string,
  txNew: Transaction,
  signedData?: string
) {
  const { tx, blindingValues, length } = JSON.parse(serializedTransaction);
  const parsedTx = JSON.parse(tx);
  if (signedData) {
    parsedTx.feePayer = JSON.parse(signedData).zkappCommand.feePayer;
  }
  const transaction = Mina.Transaction.fromJSON(parsedTx) as Mina.Transaction<false, false>;
  if (length !== txNew.transaction.accountUpdates.length || length !== transaction.transaction.accountUpdates.length) {
    throw new Error("Mesa transaction account update length mismatch");
  }
  for (let index = 0; index < length; index += 1) {
    const lazyAuthorization = txNew.transaction.accountUpdates[index].lazyAuthorization;
    transaction.transaction.accountUpdates[index].lazyAuthorization = lazyAuthorization;
    if (blindingValues[index] !== "") {
      (lazyAuthorization as any).blindingValue = Field.fromJSON(blindingValues[index]);
    }
  }
  return transaction;
}
