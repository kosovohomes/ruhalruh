import { randomBytes, scrypt as nodeScrypt, type ScryptOptions, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const OPTIONS: ScryptOptions = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const PREFIX = "scrypt$N=16384,r=8,p=1";

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(password, salt, KEY_LENGTH, OPTIONS, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await scrypt(password, salt);
  return `${PREFIX}$${salt.toString("base64url")}$${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt" || parts[1] !== "N=16384,r=8,p=1") {
    return false;
  }

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[2], "base64url");
    expected = Buffer.from(parts[3], "base64url");
  } catch {
    return false;
  }

  if (salt.length !== SALT_LENGTH || expected.length !== KEY_LENGTH) return false;

  const derivedKey = await scrypt(password, salt);
  return timingSafeEqual(derivedKey, expected);
}
