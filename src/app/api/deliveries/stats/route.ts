import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const url = new URL(req.url);
  const payment = url.searchParams.get("payment");
  const paymentFilter = payment ? { paymentMethod: payment } : {};

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  const [total, pendingAssignment, inTransit, assigned, deliveredToday] =
    await Promise.all([
      Delivery.countDocuments({ ...paymentFilter }),
      Delivery.countDocuments({ ...paymentFilter, status: "pending" }),
      Delivery.countDocuments({ ...paymentFilter, status: "in_transit" }),
      Delivery.countDocuments({ ...paymentFilter, status: "assigned" }),
      Delivery.countDocuments({
        ...paymentFilter,
        status: "delivered",
        updatedAt: { $gte: startOfToday, $lt: endOfToday },
      }),
    ]);

  return NextResponse.json({
    total,
    pendingAssignment,
    inTransit,
    assigned,
    deliveredToday,
  });
}
