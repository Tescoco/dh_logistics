import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  await connectToDatabase();
  const adminEmail = "admin@shipz.com";
  const exists = await User.findOne({ email: adminEmail });
  if (exists) {
    return NextResponse.json({ ok: true, message: "Admin exists" });
  }
  const passwordHash = await hashPassword("password123");
  await User.create({
    firstName: "Shipz",
    lastName: "Admin",
    email: adminEmail,
    role: "admin",
    passwordHash,
  });
  return NextResponse.json({ ok: true });
}
