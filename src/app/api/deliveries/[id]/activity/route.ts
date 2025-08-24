import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { getAuthUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  await connectToDatabase();
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const delivery = await Delivery.findById(id)
      .select("activityLog")
      .populate("activityLog.performedBy", "firstName lastName role")
      .lean();

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    // If not admin, only allow access to own deliveries
    if (authUser.role !== "admin") {
      const fullDelivery = await Delivery.findById(id)
        .select("createdById")
        .lean();

      if (fullDelivery?.createdById?.toString() !== authUser.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    return NextResponse.json({
      activityLog: delivery.activityLog || [],
    });
  } catch (err) {
    console.error("Get activity log error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
