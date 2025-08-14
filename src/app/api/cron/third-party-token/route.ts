import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Settings } from "@/models/Settings";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  await connectToDatabase();
  try {
    const url = new URL("https://codsolution.co/ship/Api/loginApi");
    // Using provided static admin creds
    url.searchParams.set("email", "zaidansari864@gmail.com");
    url.searchParams.set("password", "ZXCasd123@");
    const r = await fetch(url.toString(), { method: "POST" });
    const j = await r.json().catch(() => null);
    if (
      !j ||
      !(j.status === "success" || j.status === "Success") ||
      !j.bearer_token
    ) {
      return NextResponse.json(
        { ok: false, error: "Failed to fetch token" },
        { status: 500 }
      );
    }
    const doc = (await Settings.findOne()) || (await Settings.create({}));
    doc.thirdPartyBearerToken = j.bearer_token;
    doc.thirdPartyTokenUpdatedAt = new Date();
    await doc.save();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
