import { cookies } from "next/headers";
import { verifyJwt, type JwtPayload } from "@/lib/jwt";
import type { NextRequest } from "next/server";

export type AuthUser = {
  userId: string;
  role: "admin" | "driver" | "manager" | "customer";
  email: string;
};

export async function getAuthUserFromCookies(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get("auth_token")?.value;
  if (!token) return null;
  try {
    const payload = await verifyJwt<JwtPayload>(token);
    return { userId: payload.sub, role: payload.role, email: payload.email };
  } catch {
    return null;
  }
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  try {
    const payload = await verifyJwt<JwtPayload>(token);
    return { userId: payload.sub, role: payload.role, email: payload.email };
  } catch {
    return null;
  }
}

export function isThirdPartyTokenValid(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const raw = localStorage.getItem("third_party_auth");
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { token?: string; expiresAt?: number };
    if (!parsed?.token || !parsed?.expiresAt) return false;
    return Date.now() < parsed.expiresAt;
  } catch {
    return false;
  }
}
