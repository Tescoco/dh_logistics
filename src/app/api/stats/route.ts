import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { User } from "@/models/User";
import { getAuthUserFromCookies } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  await connectToDatabase();
  const auth = await getAuthUserFromCookies();
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = auth.role !== "admin" ? { createdById: auth.userId } : {};
  const [activeDeliveries, delivered, returned, users, inTransit] =
    await Promise.all([
      Delivery.countDocuments({
        ...scope,
        status: { $in: ["assigned", "in_transit"] },
      }),
      Delivery.countDocuments({ ...scope, status: "delivered" }),
      Delivery.countDocuments({ ...scope, status: "returned" }),
      User.countDocuments({}),
      Delivery.countDocuments({ ...scope, status: "in_transit" }),
    ]);
  return NextResponse.json({
    activeDeliveries,
    delivered,
    returned,
    totalUsers: users,
    inTransit,
  });
}
