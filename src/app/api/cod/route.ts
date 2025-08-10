import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { getAuthUser } from "@/lib/session";

export const runtime = "nodejs";

// Returns aggregate COD stats for a given date range
export async function GET(req: NextRequest) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const start = from ? new Date(from) : new Date(0);
  const end = to ? new Date(to) : new Date();

  const match: any = {
    paymentMethod: "cod",
    createdAt: { $gte: start, $lte: end },
  } as const;
  if (auth.role !== "admin") match.createdById = auth.userId;

  const [totalAmountAgg, deliveries, pendingAmountAgg, collectedAmountAgg] =
    await Promise.all([
      Delivery.aggregate([
        { $match: match },
        { $group: { _id: null, sum: { $sum: "$codAmount" } } },
      ]),
      Delivery.countDocuments(match),
      Delivery.aggregate([
        {
          $match: {
            ...match,
            status: { $in: ["pending", "in_transit", "assigned"] },
          },
        },
        { $group: { _id: null, sum: { $sum: "$codAmount" } } },
      ]),
      Delivery.aggregate([
        { $match: { ...match, status: "delivered" } },
        { $group: { _id: null, sum: { $sum: "$codAmount" } } },
      ]),
    ]);

  const totalAmount = totalAmountAgg[0]?.sum ?? 0;
  const pendingAmount = pendingAmountAgg[0]?.sum ?? 0;
  const collectedAmount = collectedAmountAgg[0]?.sum ?? 0;

  return NextResponse.json({
    totalAmount,
    deliveries,
    pendingAmount,
    collectedAmount,
  });
}
