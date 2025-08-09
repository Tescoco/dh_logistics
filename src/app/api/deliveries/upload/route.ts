import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { getAuthUser } from "@/lib/session";

export const runtime = "nodejs";

// Expected CSV headers: id,status
// Example:
// 64f1ab...,delivered
// 64f1ac...,in_transit
export async function POST(req: NextRequest) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return NextResponse.json({ error: "Empty CSV" }, { status: 400 });
    }
    let startIdx = 0;
    const header = lines[0].toLowerCase();
    if (header.includes("id") && header.includes("status")) {
      startIdx = 1;
    }
    const allowed = new Set(["pending", "assigned", "in_transit", "delivered", "returned"]);
    const updates: { id: string; status: string }[] = [];
    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim());
      if (parts.length < 2) continue;
      const [id, status] = parts;
      if (!id || !status || !allowed.has(status)) continue;
      updates.push({ id, status });
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid rows" }, { status: 400 });
    }
    // Process sequentially to keep it simple; can be optimized with bulkWrite
    let success = 0;
    for (const u of updates) {
      const res = await Delivery.updateOne({ _id: u.id }, { $set: { status: u.status } });
      if (res.modifiedCount > 0) success++;
    }
    return NextResponse.json({ ok: true, processed: updates.length, updated: success });
  } catch (e) {
    console.error("CSV upload error", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


