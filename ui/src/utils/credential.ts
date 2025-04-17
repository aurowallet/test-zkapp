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

// credentials expire after 1 year
const CREDENTIAL_EXPIRY = 365 * 24 * 60 * 60 * 1000;
const Bytes16 = Bytes(16);
const privateKey = PrivateKey.fromBase58(
  "EKDsgej3YrJriYnibHcEsJtYmoRsp2mzD2ta98EkvdNNLeXsrNB9"
);
const publicKey = privateKey.toPublicKey();

const schema = Schema({
  /**
   * Nationality of the owner.
   */
  nationality: Schema.String,

  /**
   * Full name of the owner.
   */
  name: Schema.String,

  /**
   * Date of birth of the owner.
   */
  birthDate: Int64,

  /**
   * Owner ID (16 bytes).
   */
  id: Bytes16,

  /**
   * Timestamp when the credential expires.
   */
  expiresAt: Schema.Number,
});

// Generates a random 6-letter name (case sensitive)
function randomName() {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let name = "";
  for (let i = 0; i < 6; i++) {
    name += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return name;
}
// Generates a random timestamp matching a birth date format
function randomBirthTime() {
  // Reasonable range for birth dates (e.g., 1920 to 2025)
  const start = new Date(1920, 0, 1).getTime();
  const end = new Date(2025, 11, 31).getTime();
  // Random date between start and end
  const randomDate = new Date(start + Math.random() * (end - start));
  return randomDate.getTime();
}

// Generates a random country code (ISO 3166-1 alpha-2)
function randomCountryCode() {
  const countryCodes = [
    "US",
    "CA",
    "GB",
    "FR",
    "DE",
    "IT",
    "ES",
    "JP",
    "CN",
    "IN",
    "BR",
    "AU",
    "RU",
    "ZA",
    "KR",
    "MX",
    "NL",
    "SE",
    "CH",
    "TR",
    // Add more codes as needed
  ];
  return countryCodes[Math.floor(Math.random() * countryCodes.length)];
}
export function issueCredential(owner: string) {
  const name = randomName();
  const birthDate = randomBirthTime();
  const nationality = randomCountryCode();
  // random 16 bytes ID
  let id = Bytes16.random();

  let expiresAt = Date.now() + CREDENTIAL_EXPIRY;

  let credential = {
    owner: PublicKey.fromBase58(owner),
    data: schema.from({
      name,
      nationality,
      birthDate: Int64.from(birthDate),
      id,
      expiresAt,
    }),
  };

  let signed = Credential.sign(privateKey, credential);
  return {
    sourceData: {
      name,
      birthDate,
      nationality,
    },
    credential: Credential.toJSON(signed),
  };
}

// ====== Presentation
let lock = Promise.resolve();

async function queuePromise<T>(fn: () => Promise<T>) {
  // acquire the lock
  let existingLock = lock;
  let unlock = () => {};
  lock = new Promise((resolve) => (unlock = resolve));

  // await the existing lock
  await existingLock;

  // run the function and release the lock
  try {
    return await fn();
  } finally {
    unlock();
  }
}

// use a `DynamicRecord` to allow more fields in the credential than we explicitly list
// here, we ONLY care about whether the user has a valid credential issued by this server
const CredentialNativeSchema = DynamicRecord(
  { expiresAt: UInt64 },
  { maxEntries: 20 }
);

const authenticationSpec = Spec(
  {
    credential: Credential.Native(CredentialNativeSchema),
    expectedIssuer: Claim(Field),
    createdAt: Claim(UInt64),
  },
  ({ credential, expectedIssuer, createdAt }) => {
    // extract properties from the credential
    let issuer = Operation.issuer(credential);
    let expiresAt = Operation.property(credential, "expiresAt");

    // we assert that:
    // - the credential issuer matches the expected (public) input, i.e. this server
    // - the credential is not expired (by comparing with the current date)
    return {
      assert: Operation.and(
        Operation.equals(issuer, expectedIssuer),
        Operation.lessThanEq(createdAt, expiresAt)
      ),
    };
  }
);

let compiledRequestPromise = queuePromise(() =>
  Presentation.precompile(authenticationSpec)
);
compiledRequestPromise.then(() =>
  console.log(`Compiled request after ${performance.now().toFixed(2)}ms`)
);

const SERVER_ID = "credentials-web-demo-server";
const ACTION_ID = `${SERVER_ID}:anonymous-login`;
const openRequests = new Map<string, Request>();

export async function createRequest(createdAt: UInt64) {
  let expectedIssuer = Credential.Native.issuer(publicKey);
  let compiled = await compiledRequestPromise;

  let request = PresentationRequest.httpsFromCompiled(
    compiled,
    { expectedIssuer, createdAt },
    { action: ACTION_ID }
  );
  openRequests.set(request.inputContext.serverNonce.toString(), request as any);
  return request;
}

export async function verifyLogin(presentationJson: string) {
    let presentation = Presentation.fromJSON(presentationJson);
    let nonce = presentation.serverNonce.toString();
    let request = openRequests.get(nonce);
    if (!request) throw Error('Unknown presentation');
    // date must be within 5 minutes of the current date
    let createdAt = Number((request as any).claims.createdAt);
    assert(createdAt > Date.now() - 5 * 60 * 1000, 'Expired presentation');
    // verify the presentation
    await Presentation.verify((request as any), presentation, {
      verifierIdentity: window.location.origin,
    });
    openRequests.delete(nonce);
    return 
  }
  