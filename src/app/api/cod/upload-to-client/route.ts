import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { getAuthUser } from "@/lib/session";

export const runtime = "nodejs";

const UploadCODSchema = z.object({
  from: z.string(),
  to: z.string(),
  client: z.string().optional(),
  deliveries: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const input = UploadCODSchema.parse(body);

    // Here you would typically:
    // 1. Generate the COD report data
    // 2. Send it to your client portal system (Shipz Solutions)
    // 3. Notify the client

    // For now, we'll simulate the upload process
    console.log("Uploading COD report to client portal:", {
      from: input.from,
      to: input.to,
      client: input.client,
      deliveryCount: input.deliveries.length,
    });

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real implementation, you would:
    // 1. Call your client portal API
    // 2. Upload the report data
    // 3. Handle any errors from the client portal

    return NextResponse.json({
      success: true,
      message: "COD report uploaded to client portal successfully",
      reportId: `cod_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error("COD upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload COD report to client portal" },
      { status: 500 }
    );
  }
}
