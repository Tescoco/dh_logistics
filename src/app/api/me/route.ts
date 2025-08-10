import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ user: null }, { status: 200 });
  await connectToDatabase();
  const user = await User.findById(auth.userId)
    .select("firstName lastName email role phone avatarUrl")
    .lean();
  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (typeof body.firstName === "string") update.firstName = body.firstName;
  if (typeof body.lastName === "string") update.lastName = body.lastName;
  if (typeof body.phone === "string") update.phone = body.phone;
  if (typeof body.email === "string") update.email = body.email;
  if (typeof body.avatarUrl === "string") update.avatarUrl = body.avatarUrl;
  await User.findByIdAndUpdate(auth.userId, { $set: update });
  return NextResponse.json({ ok: true });
}
