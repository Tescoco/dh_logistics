import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { getAuthUserFromCookies } from "@/lib/session";

const BulkDeliverySchema = z.object({
  ids: z
    .array(
      z
        .string()
        .regex(/^[a-f0-9]{24}$/i, { message: "Invalid delivery id format" })
    )
    .min(1),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    // Check authentication
    const user = await getAuthUserFromCookies();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = BulkDeliverySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { ids } = validation.data;

    // Fetch deliveries by IDs
    const deliveries = await Delivery.find({
      _id: { $in: ids },
    })
      .populate("createdById", "firstName lastName")
      .lean();

    if (!deliveries || deliveries.length === 0) {
      return NextResponse.json(
        { error: "No deliveries found" },
        { status: 404 }
      );
    }

    // Return deliveries in the same order as requested IDs
    const orderedDeliveries = ids
      .map((id) =>
        deliveries.find((delivery) => delivery._id.toString() === id)
      )
      .filter(Boolean);

    return NextResponse.json({
      deliveries: orderedDeliveries,
      count: orderedDeliveries.length,
    });
  } catch (error) {
    console.error("Bulk delivery fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
