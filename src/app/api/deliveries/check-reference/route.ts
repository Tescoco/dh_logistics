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
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");
    
    if (!reference) {
      return NextResponse.json(
        { error: "Reference parameter is required" },
        { status: 400 }
      );
    }

    // Check if reference exists
    const existingDelivery = await Delivery.findOne({ reference }).select("_id").lean();
    const exists = !!existingDelivery;
    
    return NextResponse.json({ exists, reference });
  } catch (error) {
    console.error("Error checking reference:", error);
    return NextResponse.json(
      { error: "Failed to check reference" },
      { status: 500 }
    );
  }
}
