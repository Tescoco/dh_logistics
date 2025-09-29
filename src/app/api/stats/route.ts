import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { User } from "@/models/User";
import { getAuthUserFromCookies } from "@/lib/session";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

export async function GET() {
  await connectToDatabase();
  const auth = await getAuthUserFromCookies();
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope =
    auth.role !== "admin" ? { createdById: new ObjectId(auth.userId) } : {};
  const now = new Date();
  const currentWindowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const previousWindowStart = new Date(
    now.getTime() - 60 * 24 * 60 * 60 * 1000
  );
  // Inclusive window ends (subtract 1ms from boundary so we can use $lte)
  const currentWindowEndInclusive = new Date(now.getTime());
  const previousWindowEndInclusive = new Date(currentWindowStart.getTime() - 1);

  console.log("scope", scope);

  const [
    activeDeliveries,
    delivered,
    returned,
    totalUsers,
    inTransit,
    pending,
    assigned,
    noAnswer,
    outForDelivery,
    productDestroyed,
    lostShipments,
    damagedShipments,
    readyForReturn,
    returnInTransit,
    returnedToClient,
    shipmentOnHold,
    returnedToInventory,
    rto,
    futureDelivery,
    deliveredPrev30,
    deliveredLast30,
    returnedPrev30,
    returnedLast30,
    inTransitPrevWindow,
    inTransitLastWindow,
    deliveredPrev30Global,
    deliveredLast30Global,
    returnedPrev30Global,
    returnedLast30Global,
    inTransitPrevWindowGlobal,
    inTransitLastWindowGlobal,
    allDeliveries,
  ] = await Promise.all([
    // current snapshots
    Delivery.countDocuments({
      ...scope,
      status: { $in: ["assigned"] },
    }),
    Delivery.countDocuments({ ...scope, status: "delivered" }),
    Delivery.countDocuments({ ...scope, status: "returned" }),
    User.countDocuments({}),
    Delivery.countDocuments({ ...scope, status: "in_transit" }),
    Delivery.countDocuments({ ...scope, status: "pending" }),
    Delivery.countDocuments({ ...scope, status: "assigned" }),
    // Using returned as proxy for "no answer" - could be refined with specific field
    Delivery.countDocuments({
      ...scope,
      status: "returned",
      notes: { $regex: /no answer|no response/i },
    }),
    // Using in_transit as proxy for "out for delivery" - could be refined
    Delivery.countDocuments({ ...scope, status: "in_transit" }),
    // Using lost_damaged status for product destroyed
    Delivery.countDocuments({ ...scope, status: "lost_damaged" }),
    // Using lost_damaged status for lost shipments
    Delivery.countDocuments({ ...scope, status: "lost_damaged" }),
    // Using lost_damaged status for damaged shipments
    Delivery.countDocuments({ ...scope, status: "lost_damaged" }),
    // Ready for return - using returned status
    Delivery.countDocuments({ ...scope, status: "returned" }),
    // Return in transit - using rto status
    Delivery.countDocuments({ ...scope, status: "rto" }),
    // Returned to client - using returned status
    Delivery.countDocuments({ ...scope, status: "returned" }),
    // Shipment on hold - using drafts
    Delivery.countDocuments({ ...scope, isDraft: true }),
    // Returned to inventory - using returned status
    Delivery.countDocuments({ ...scope, status: "returned" }),
    // RTO status
    Delivery.countDocuments({ ...scope, status: "rto" }),
    // Future delivery
    Delivery.countDocuments({ ...scope, status: "future_delivery" }),
    // windowed counts for % change calculations
    Delivery.countDocuments({
      ...scope,
      status: "delivered",
      updatedAt: {
        $gte: previousWindowStart,
        $lte: previousWindowEndInclusive,
      },
    }),
    Delivery.countDocuments({
      ...scope,
      status: "delivered",
      updatedAt: { $gte: currentWindowStart, $lte: currentWindowEndInclusive },
    }),
    Delivery.countDocuments({
      ...scope,
      status: "returned",
      updatedAt: {
        $gte: previousWindowStart,
        $lte: previousWindowEndInclusive,
      },
    }),
    Delivery.countDocuments({
      ...scope,
      status: "returned",
      updatedAt: { $gte: currentWindowStart, $lte: currentWindowEndInclusive },
    }),
    Delivery.countDocuments({
      ...scope,
      status: "in_transit",
      updatedAt: {
        $gte: previousWindowStart,
        $lte: previousWindowEndInclusive,
      },
    }),
    Delivery.countDocuments({
      ...scope,
      status: "in_transit",
      updatedAt: { $gte: currentWindowStart, $lte: currentWindowEndInclusive },
    }),
    // global windowed counts for admin-wide changes (unscoped)
    Delivery.countDocuments({
      ...scope,
      status: "delivered",
      updatedAt: {
        $gte: previousWindowStart,
        $lte: previousWindowEndInclusive,
      },
    }),
    Delivery.countDocuments({
      ...scope,
      status: "delivered",
      updatedAt: { $gte: currentWindowStart, $lte: currentWindowEndInclusive },
    }),
    Delivery.countDocuments({
      ...scope,
      status: "returned",
      updatedAt: {
        $gte: previousWindowStart,
        $lte: previousWindowEndInclusive,
      },
    }),
    Delivery.countDocuments({
      ...scope,
      status: "returned",
      updatedAt: { $gte: currentWindowStart, $lte: currentWindowEndInclusive },
    }),
    Delivery.countDocuments({
      ...scope,
      status: "in_transit",
      updatedAt: {
        $gte: previousWindowStart,
        $lte: previousWindowEndInclusive,
      },
    }),
    Delivery.countDocuments({
      ...scope,
      status: "in_transit",
      updatedAt: { $gte: currentWindowStart, $lte: currentWindowEndInclusive },
    }),
    Delivery.countDocuments({ ...scope }),
  ]);

  function percentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  const totalLastWindow =
    deliveredLast30 + returnedLast30 + inTransitLastWindow;
  const totalPrevWindow =
    deliveredPrev30 + returnedPrev30 + inTransitPrevWindow;
  const totalLastWindowGlobal =
    deliveredLast30Global + returnedLast30Global + inTransitLastWindowGlobal;
  const totalPrevWindowGlobal =
    deliveredPrev30Global + returnedPrev30Global + inTransitPrevWindowGlobal;

  const totalParcels = allDeliveries;

  return NextResponse.json({
    // Main stats
    totalParcels,
    activeDeliveries,
    delivered,
    returned,
    totalUsers: auth.role === "admin" ? totalUsers : undefined,
    inTransit,
    pending,
    assigned,

    // Extended status categories
    noAnswer,
    outForDelivery,
    productDestroyed,
    lostShipments,
    damagedShipments,
    readyForReturn,
    returnInTransit,
    returnedToClient,
    shipmentOnHold,
    returnedToInventory,
    rto,
    futureDelivery,

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
