import {
  Credential,
  DynamicRecord,
  Presentation,
  PresentationRequest,
  Schema,
  Claim,
  Operation,
  Spec,
  assert,
} from "mina-attestations";
import { Bytes, Field, Int64, PrivateKey, PublicKey, UInt64 } from "o1js";

const CREDENTIAL_EXPIRY = 365 * 24 * 60 * 60 * 1000;
const Bytes16 = Bytes(16);
const privateKey = PrivateKey.fromBase58(
  "EKDsgej3YrJriYnibHcEsJtYmoRsp2mzD2ta98EkvdNNLeXsrNB9"
);
const publicKey = privateKey.toPublicKey();

const schema = Schema({
  nationality: Schema.String,
  name: Schema.String,
  birthDate: Int64,
  id: Bytes16,
  expiresAt: Schema.Number,
});

function randomName() {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
}

function randomBirthTime() {
  const start = new Date(1920, 0, 1).getTime();
  const end = new Date(2025, 11, 31).getTime();
  return Math.floor(start + Math.random() * (end - start));
}

function randomCountryCode() {
  const countryCodes = ["US", "CA", "GB", "FR", "DE", "IT", "ES", "JP", "CN", "IN", "BR", "AU", "RU", "ZA", "KR", "MX", "NL", "SE", "CH", "TR"];
  return countryCodes[Math.floor(Math.random() * countryCodes.length)];
}

export function issueCredential(owner: string) {
  const name = randomName();
  const birthDate = randomBirthTime();
  const nationality = randomCountryCode();
  const credential = {
    owner: PublicKey.fromBase58(owner),
    data: schema.from({
      name,
      nationality,
      birthDate: Int64.from(birthDate),
      id: Bytes16.random(),
      expiresAt: Date.now() + CREDENTIAL_EXPIRY,
    }),
  };
  return {
    sourceData: { name, birthDate, nationality },
    credential: Credential.toJSON(Credential.sign(privateKey, credential)),
  };
}

let lock = Promise.resolve();

async function queuePromise<T>(fn: () => Promise<T>) {
  const existingLock = lock;
  let unlock = () => {};
  lock = new Promise((resolve) => (unlock = resolve));
  await existingLock;
  try {
    return await fn();
  } finally {
    unlock();
  }
}

const CredentialNativeSchema = DynamicRecord({ expiresAt: UInt64 }, { maxEntries: 20 });
const authenticationSpec = Spec(
  {
    credential: Credential.Native(CredentialNativeSchema),
    expectedIssuer: Claim(Field),
    createdAt: Claim(UInt64),
  },
  ({ credential, expectedIssuer, createdAt }) => ({
    assert: Operation.and(
      Operation.equals(Operation.issuer(credential), expectedIssuer),
      Operation.lessThanEq(createdAt, Operation.property(credential, "expiresAt"))
    ),
  })
);

const compiledRequestPromise = queuePromise(() => Presentation.precompile(authenticationSpec));
const SERVER_ID = "credentials-web-demo-server";
const ACTION_ID = `${SERVER_ID}:anonymous-login`;
const openRequests = new Map<string, Request>();

export async function createRequest(createdAt: UInt64) {
  const compiled = await compiledRequestPromise;
  const request = PresentationRequest.httpsFromCompiled(
    compiled,
    { expectedIssuer: Credential.Native.issuer(publicKey), createdAt },
    { action: ACTION_ID }
  );
  openRequests.set(request.inputContext.serverNonce.toString(), request as any);
  return request;
}

export async function verifyLogin(presentationJson: string) {
  const presentation = Presentation.fromJSON(presentationJson);
  const nonce = presentation.serverNonce.toString();
  const request = openRequests.get(nonce);
  if (!request) throw Error("Unknown presentation");
  const createdAt = Number((request as any).claims.createdAt);
  assert(createdAt > Date.now() - 5 * 60 * 1000, "Expired presentation");
  await Presentation.verify(request as any, presentation, {
    verifierIdentity: window.location.origin,
  });
  openRequests.delete(nonce);
}
