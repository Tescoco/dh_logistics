import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { getAuthUser } from "@/lib/session";
import { User } from "@/models/User";

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
    const driverUsers = await User.find({ role: "driver" })
      .select("_id")
      .lean();
    const driverUserIds = driverUsers.map((u: { _id: unknown }) => u._id);
    if (driverUserIds.length > 0) {
      query.assignedDriverId = { $in: driverUserIds };
    } else {
      return NextResponse.json({ deliveries: [] });
    }
  }
  // if tab is cod get all deliveries with assignedDriverId that is equal to 68992b3ad5eb3b93c40396dc
  if (tab === "cod") {
    query.assignedDriverId = "68992b3ad5eb3b93c40396dc";
  }

  if (tab === "courier") {
    const courierUsers = await User.find({ role: "courier" })
      .select("_id")
      .lean();
    const courierUserIds = courierUsers.map((u: { _id: unknown }) => u._id);
    if (courierUserIds.length > 0) {
      query.assignedDriverId = { $in: courierUserIds };
    } else {
      return NextResponse.json({ deliveries: [] });
    }
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
      Delivery.countDocuments({ ...paymentFilter, ...ownerFilter, ...query }),
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
