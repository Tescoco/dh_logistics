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
  const now = new Date();
  const currentWindowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const previousWindowStart = new Date(
    now.getTime() - 60 * 24 * 60 * 60 * 1000
  );

  const [activeDeliveries, delivered, returned, users, inTransit, deliveredPrev30, deliveredLast30, returnedPrev30, returnedLast30, inTransitPrevWindow, inTransitLastWindow, deliveredPrev30Global, deliveredLast30Global, returnedPrev30Global, returnedLast30Global, inTransitPrevWindowGlobal, inTransitLastWindowGlobal] =
    await Promise.all([
      // current snapshots
      Delivery.countDocuments({
        ...scope,
        status: { $in: ["assigned", "in_transit"] },
      }),
      Delivery.countDocuments({ ...scope, status: "delivered" }),
      Delivery.countDocuments({ ...scope, status: "returned" }),
      User.countDocuments({}),
      Delivery.countDocuments({ ...scope, status: "in_transit" }),
      // windowed counts for % change calculations
      Delivery.countDocuments({
        ...scope,
        status: "delivered",
        updatedAt: { $gte: previousWindowStart, $lt: currentWindowStart },
      }),
      Delivery.countDocuments({
        ...scope,
        status: "delivered",
        updatedAt: { $gte: currentWindowStart, $lt: now },
      }),
      Delivery.countDocuments({
        ...scope,
        status: "returned",
        updatedAt: { $gte: previousWindowStart, $lt: currentWindowStart },
      }),
      Delivery.countDocuments({
        ...scope,
        status: "returned",
        updatedAt: { $gte: currentWindowStart, $lt: now },
      }),
      Delivery.countDocuments({
        ...scope,
        status: "in_transit",
        updatedAt: { $gte: previousWindowStart, $lt: currentWindowStart },
      }),
      Delivery.countDocuments({
        ...scope,
        status: "in_transit",
        updatedAt: { $gte: currentWindowStart, $lt: now },
      }),
      // global windowed counts for admin-wide changes (unscoped)
      Delivery.countDocuments({
        status: "delivered",
        updatedAt: { $gte: previousWindowStart, $lt: currentWindowStart },
      }),
      Delivery.countDocuments({
        status: "delivered",
        updatedAt: { $gte: currentWindowStart, $lt: now },
      }),
      Delivery.countDocuments({
        status: "returned",
        updatedAt: { $gte: previousWindowStart, $lt: currentWindowStart },
      }),
      Delivery.countDocuments({
        status: "returned",
        updatedAt: { $gte: currentWindowStart, $lt: now },
      }),
      Delivery.countDocuments({
        status: "in_transit",
        updatedAt: { $gte: previousWindowStart, $lt: currentWindowStart },
      }),
      Delivery.countDocuments({
        status: "in_transit",
        updatedAt: { $gte: currentWindowStart, $lt: now },
      }),
    ]);

  function percentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  const totalLastWindow = deliveredLast30 + returnedLast30 + inTransitLastWindow;
  const totalPrevWindow = deliveredPrev30 + returnedPrev30 + inTransitPrevWindow;
  const totalLastWindowGlobal =
    deliveredLast30Global + returnedLast30Global + inTransitLastWindowGlobal;
  const totalPrevWindowGlobal =
    deliveredPrev30Global + returnedPrev30Global + inTransitPrevWindowGlobal;

  return NextResponse.json({
    activeDeliveries,
    delivered,
    returned,
    totalUsers: users,
    inTransit,
    changes: {
      totalPct: percentChange(totalLastWindow, totalPrevWindow),
      deliveredPct: percentChange(deliveredLast30, deliveredPrev30),
      returnedPct: percentChange(returnedLast30, returnedPrev30),
      inTransitPct: percentChange(inTransitLastWindow, inTransitPrevWindow),
    },
    adminChanges: {
      totalPct: percentChange(totalLastWindowGlobal, totalPrevWindowGlobal),
      deliveredPct: percentChange(deliveredLast30Global, deliveredPrev30Global),
      returnedPct: percentChange(returnedLast30Global, returnedPrev30Global),
      inTransitPct: percentChange(
        inTransitLastWindowGlobal,
        inTransitPrevWindowGlobal
      ),
    },
  });
}
