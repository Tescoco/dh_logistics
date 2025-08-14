import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { getAuthUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const payment = url.searchParams.get("payment");
  const tab = url.searchParams.get("tab");
  const query: Record<string, unknown> = {};
  if (tab === "internal") {
    query.assignedDriverId = { $ne: "68992b3ad5eb3b93c40396dc" };
  }
  // if tab is cod get all deliveries with assignedDriverId that is equal to 68992b3ad5eb3b93c40396dc
  if (tab === "cod") {
    query.assignedDriverId = "68992b3ad5eb3b93c40396dc";
  }

  const paymentFilter = payment ? { paymentMethod: payment } : {};

  const ownerFilter = auth.role !== "admin" ? { createdById: auth.userId } : {};

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
  // Make the end bound inclusive by moving back 1 ms
  const endOfTodayInclusive = new Date(endOfToday.getTime() - 1);

  const [total, pendingAssignment, inTransit, assigned, deliveredToday] =
    await Promise.all([
      Delivery.countDocuments({ ...paymentFilter, ...ownerFilter }),
      Delivery.countDocuments({
        ...paymentFilter,
        ...ownerFilter,
        status: "pending",
        ...query,
      }),
      Delivery.countDocuments({
        ...paymentFilter,
        ...ownerFilter,
        status: "in_transit",
        ...query,
      }),
      Delivery.countDocuments({
        ...paymentFilter,
        ...ownerFilter,
        status: "assigned",
        ...query,
      }),
      Delivery.countDocuments({
        ...paymentFilter,
        ...ownerFilter,
        status: "delivered",
        ...query,
        updatedAt: { $gte: startOfToday, $lte: endOfTodayInclusive },
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
