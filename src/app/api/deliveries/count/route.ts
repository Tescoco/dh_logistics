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

  try {
    const query: Record<string, unknown> = {};

    const count = await Delivery.countDocuments(query);

    return NextResponse.json({
      count,
    });
  } catch (error) {
    console.error("Error counting deliveries:", error);
    return NextResponse.json(
      { error: "Failed to count deliveries" },
      { status: 500 }
    );
  }
}
