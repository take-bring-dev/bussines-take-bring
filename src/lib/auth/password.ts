import bcrypt from "bcryptjs";
import { BCRYPT_COST } from "./constants";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
