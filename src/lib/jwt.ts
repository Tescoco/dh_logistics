import { SignJWT, jwtVerify } from "jose";
import { ENV } from "@/lib/env";

const encoder = new TextEncoder();

export type JwtPayload = {
  sub: string;
  role: "admin" | "driver" | "manager" | "customer";
  email: string;
};

export async function createJwt(payload: JwtPayload): Promise<string> {
  const secret = encoder.encode(ENV.JWT_SECRET());
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  return token;
}

export async function verifyJwt<T extends object = JwtPayload>(
  token: string
): Promise<T> {
  const secret = encoder.encode(ENV.JWT_SECRET());
  const { payload } = await jwtVerify<T>(token, secret);
  return payload;
}
