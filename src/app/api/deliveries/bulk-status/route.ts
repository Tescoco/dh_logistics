import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { Types } from "mongoose";
import { getAuthUser } from "@/lib/session";

export const runtime = "nodejs";

const BulkSchema = z.object({
  ids: z.array(z.string().min(1)),
  status: z.enum([
    "pending",
    "assigned",
    "in_transit",
    "delivered",
    "returned",
  ]),
});

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const input = BulkSchema.parse(body);

    // Accept multiple identifier formats:
    // - Full Mongo ObjectId (24-hex)
    // - Last 8 chars of ObjectId shown in UI
    // - Delivery reference string
    const orClauses: Record<string, unknown>[] = [];
    for (const token of input.ids) {
      const trimmed = token.trim();
      if (!trimmed) continue;
      // Match exact reference
      orClauses.push({ reference: trimmed });
      // Match full ObjectId
      if (/^[a-fA-F0-9]{24}$/.test(trimmed)) {
        try {
          orClauses.push({ _id: new Types.ObjectId(trimmed) });
        } catch {}
      }
      // Match by ObjectId suffix (case-insensitive)
      orClauses.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: `${trimmed}$`,
            options: "i",
          },
        },
      });
    }

    if (orClauses.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    const result = await Delivery.updateMany(
      { $or: orClauses },
      { $set: { status: input.status } }
    );
    // Safely read modifiedCount if present
    const updatedCount: number | undefined =
      typeof (result as unknown as { modifiedCount?: unknown }).modifiedCount ===
      "number"
        ? ((result as unknown as { modifiedCount: number }).modifiedCount)
        : undefined;
    return NextResponse.json({ ok: true, updated: updatedCount });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
