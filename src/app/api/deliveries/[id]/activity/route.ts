import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/session";
import { ObjectId } from "mongodb";

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
    // Fetch all users once for activityLog resolution
    const allUsers = await User.find({})
      .select("_id firstName lastName role")
      .lean();
    const userMap = new Map(
      allUsers.map((user) => [
        user._id.toString(),
        {
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          role: user.role || "",
        },
      ])
    );

    const delivery = await Delivery.findById(id).select("activityLog").lean();

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

    // Process activityLog to resolve ObjectId performedBy to user objects
    const processedActivityLog = (delivery.activityLog || []).map(
      (activity) => ({
        ...activity,
        performedBy:
          typeof activity.performedBy === "object" &&
          activity.performedBy instanceof ObjectId
            ? userMap.get(activity.performedBy.toString()) || {
                firstName: "",
                lastName: "",
                role: "",
              }
            : activity.performedBy,
      })
    );

    return NextResponse.json({
      activityLog: processedActivityLog,
    });
  } catch (err) {
    console.error("Get activity log error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
