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
    .select("firstName lastName email role")
    .lean();
  return NextResponse.json({ user });
}
