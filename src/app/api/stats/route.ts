import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function GET() {
  await connectToDatabase();
  const [activeDeliveries, delivered, returned, users] = await Promise.all([
    Delivery.countDocuments({ status: { $in: ["assigned", "in_transit"] } }),
    Delivery.countDocuments({ status: "delivered" }),
    Delivery.countDocuments({ status: "returned" }),
    User.countDocuments({}),
  ]);
  return NextResponse.json({
    activeDeliveries,
    delivered,
    returned,
    totalUsers: users,
  });
}
