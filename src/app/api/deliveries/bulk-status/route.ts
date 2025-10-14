import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { Types } from "mongoose";
import { getAuthUser } from "@/lib/session";
import { ObjectId } from "mongodb";

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

    // First, get the deliveries that will be updated to track old status for activity logging
    const deliveriesToUpdate = await Delivery.find({ $or: orClauses })
      .select("_id status reference")
      .lean();

    // Prepare activity log entries for all deliveries being updated
    const bulkWriteOps = [];
    for (const delivery of deliveriesToUpdate) {
      if (delivery.status !== input.status) {
        bulkWriteOps.push({
          updateOne: {
            filter: { _id: delivery._id },
            update: {
              $set: { status: input.status },
              $push: {
                activityLog: {
                  action: "bulk_status_update",
                  performedBy: new ObjectId(auth.userId),
                  performedAt: new Date(),
                  details: `Status bulk updated from ${delivery.status} to ${input.status}`,
                  oldValue: delivery.status,
                  newValue: input.status,
                },
              },
            },
          },
        });
      }
    }

    let updatedCount = 0;
    if (bulkWriteOps.length > 0) {
      const result = await Delivery.bulkWrite(bulkWriteOps);
      updatedCount = result.modifiedCount;
    }

    return NextResponse.json({ ok: true, updated: updatedCount });
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
