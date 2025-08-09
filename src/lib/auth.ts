import bcrypt from "bcryptjs";
export type { JwtPayload } from "@/lib/jwt";
export { createJwt, verifyJwt } from "@/lib/jwt";

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
