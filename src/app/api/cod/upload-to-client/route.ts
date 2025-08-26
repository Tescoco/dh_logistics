import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { getAuthUser } from "@/lib/session";
import { Delivery } from "@/models/Delivery";
import { User } from "@/models/User";
import { CodReport } from "@/models/CodReport";
import {
  calculateCodStats,
  generateReportName,
  prepareDeliveryData,
  groupDeliveriesByClient,
} from "@/lib/codReportUtils";

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

    // Fetch all deliveries with their details
    const deliveries = await Delivery.find({
      _id: { $in: input.deliveries },
      paymentMethod: "cod", // Only COD deliveries
    });

    if (deliveries.length === 0) {
      return NextResponse.json(
        { error: "No COD deliveries found for the specified IDs" },
        { status: 400 }
      );
    }

    // Group deliveries by client (createdById)
    const clientDeliveries = groupDeliveriesByClient(deliveries);

    // Generate COD reports for each client
    const generatedReports = [];

    for (const [clientId, clientDeliveryList] of clientDeliveries) {
      // Get client details
      const client = await User.findById(clientId);
      if (!client) continue;

      // Calculate COD totals for this client
      const codStats = calculateCodStats(clientDeliveryList);

      // Generate report name
      const reportName = generateReportName(client, input.from);

      // Create COD report record
      const codReport = await CodReport.create({
        name: reportName,
        from: new Date(input.from),
        to: new Date(input.to),
        format: "CSV", // Default to PDF for client reports
        status: "ready",
        url: `/download/${reportName}.csv`,
        createdById: clientId,
      });

      // Prepare report data for client portal
      const reportData = {
        reportId: codReport._id.toString(),
        reportName: codReport.name,
        clientId: clientId,
        clientName:
          client.customerStoreName ||
          `${client.firstName} ${client.lastName || ""}`.trim(),
        clientEmail: client.email,
        clientPhone: client.phone,
        period: {
          from: input.from,
          to: input.to,
        },
        summary: codStats,
        deliveries: clientDeliveryList.map(prepareDeliveryData),
        generatedAt: new Date().toISOString(),
        generatedBy: auth.email, // Use email since firstName/lastName not available in AuthUser
      };

      generatedReports.push({
        clientId,
        clientName: reportData.clientName,
        reportId: codReport._id.toString(),
        reportName: codReport.name,
        summary: codStats,
        deliveryCount: clientDeliveryList.length,
      });

      // Here you would typically:
      // 1. Call your client portal API (Shipz Solutions)
      // 2. Upload the report data
      // 3. Send notification to client

      console.log(`Generated COD report for client ${reportData.clientName}:`, {
        reportId: codReport._id.toString(),
        deliveryCount: clientDeliveryList.length,
        totalCodAmount: codStats.totalCodAmount,
        pendingAmount: codStats.pendingAmount,
        generatedBy: auth.email,
      });
    }

    // Simulate API call delay for client portal upload
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedReports.length} COD reports for clients`,
      reports: generatedReports,
      totalDeliveries: deliveries.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error("COD upload error:", err);
    return NextResponse.json(
      { error: "Failed to generate and upload COD reports to client portal" },
      { status: 500 }
    );
  }
}
