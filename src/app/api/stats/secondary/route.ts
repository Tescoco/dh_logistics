import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { getAuthUserFromCookies } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  await connectToDatabase();
  const auth = await getAuthUserFromCookies();
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = auth.role !== "admin" ? { createdById: auth.userId } : {};

  const [
    readyForReturn,
    returnInTransit,
    shipmentOnHold,
    returnedInventory,
    pending,
  ] = await Promise.all([
    // Using returned as a proxy for 'Ready for Return'
    Delivery.countDocuments({ ...scope, status: "returned" }),
    // In-transit returns approximated by in_transit
    Delivery.countDocuments({ ...scope, status: "in_transit" }),
    // 'On Hold' approximated by drafts
    Delivery.countDocuments({ ...scope, isDraft: true }),
    // Returned inventory (same as returned for now)
    Delivery.countDocuments({ ...scope, status: "returned" }),
    // Pending shipments
    Delivery.countDocuments({ ...scope, status: "pending" }),
  ]);

  return NextResponse.json({
    readyForReturn,
    returnInTransit,
    shipmentOnHold,
    returnedInventory,
    pending,
  });
}
