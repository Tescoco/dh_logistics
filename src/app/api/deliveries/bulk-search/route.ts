import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { getAuthUserFromCookies } from "@/lib/session";
import { Types } from "mongoose";

type PopulatedUser = {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  courierCompanyName?: string;
};

const BulkSearchSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  format: z.enum(["json", "csv", "xls"]).default("json"),
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
    const validation = BulkSearchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { ids, format } = validation.data;

    // Build search query to match multiple formats
    const orClauses: Record<string, unknown>[] = [];
    for (const token of ids) {
      const trimmed = token.trim();
      if (!trimmed) continue;

      // Match exact reference
      orClauses.push({ reference: trimmed });

      // Match full ObjectId
      if (/^[a-fA-F0-9]{24}$/.test(trimmed)) {
        try {
          orClauses.push({
            _id: new Types.ObjectId(trimmed),
          });
        } catch {}
      }

      // Match by ObjectId suffix (case-insensitive)
      orClauses.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: `${trimmed}$`,
            options: "i",
          },
        },
      });
    }

    if (orClauses.length === 0) {
      return NextResponse.json(
        { error: "No valid search terms provided" },
        { status: 400 }
      );
    }

    // Fetch deliveries with populated fields
    const deliveries = await Delivery.find({ $or: orClauses })
      .populate("assignedDriverId", "firstName lastName")
      .populate("assignedCourierId", "firstName lastName courierCompanyName")
      .populate("createdById", "firstName lastName")
      .lean();

    if (!deliveries || deliveries.length === 0) {
      return NextResponse.json(
        { error: "No deliveries found" },
        { status: 404 }
      );
    }

    // Format data for response
    const formattedDeliveries = deliveries.map((delivery) => ({
      id: delivery._id,
      reference: delivery.reference || "",
      customerName: delivery.customerName || "",
      customerPhone: delivery.customerPhone || "",
      deliveryAddress: delivery.deliveryAddress || "",
      paymentMethod: delivery.paymentMethod || "",
      codAmount: delivery.codAmount || 0,
      priority: delivery.priority || "standard",
      status: delivery.status || "",
      assignedDriver: (delivery.assignedDriverId as PopulatedUser)?.firstName
        ? `${(delivery.assignedDriverId as PopulatedUser).firstName || ""} ${
            (delivery.assignedDriverId as PopulatedUser).lastName || ""
          }`.trim()
        : "",
      assignedCourier: (delivery.assignedCourierId as PopulatedUser)?.firstName
        ? (delivery.assignedCourierId as PopulatedUser).courierCompanyName ||
          `${(delivery.assignedCourierId as PopulatedUser).firstName || ""} ${
            (delivery.assignedCourierId as PopulatedUser).lastName || ""
          }`.trim()
        : "",
      createdBy: (delivery.createdById as PopulatedUser)?.firstName
        ? `${(delivery.createdById as PopulatedUser).firstName || ""} ${
            (delivery.createdById as PopulatedUser).lastName || ""
          }`.trim()
        : "",
      notes: delivery.notes || "",
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    }));

    // Return in requested format
    if (format === "json") {
      return NextResponse.json({
        deliveries: formattedDeliveries,
        count: formattedDeliveries.length,
      });
    } else if (format === "csv") {
      // Convert to CSV
      const headers = [
        "ID",
        "Reference",
        "Customer Name",
        "Customer Phone",
        "Delivery Address",
        "Payment Method",
        "COD Amount",
        "Priority",
        "Status",
        "Assigned Driver",
        "Assigned Courier",
        "Created By",
        "Notes",
        "Created At",
        "Updated At",
      ];

      const csvRows = [
        headers.join(","),
        ...formattedDeliveries.map((delivery) =>
          [
            delivery.id,
            `"${delivery.reference}"`,
            `"${delivery.customerName}"`,
            `"${delivery.customerPhone}"`,
            `"${delivery.deliveryAddress}"`,
            `"${delivery.paymentMethod}"`,
            delivery.codAmount,
            `"${delivery.priority}"`,
            `"${delivery.status}"`,
            `"${delivery.assignedDriver}"`,
            `"${delivery.assignedCourier}"`,
            `"${delivery.createdBy}"`,
            `"${delivery.notes}"`,
            `"${new Date(delivery.createdAt).toISOString()}"`,
            `"${new Date(delivery.updatedAt).toISOString()}"`,
          ].join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="bulk-search-${
            new Date().toISOString().split("T")[0]
          }.csv"`,
        },
      });
    } else if (format === "xls") {
      // For XLS format, we'll return a simple tab-separated format that Excel can open
      const headers = [
        "ID",
        "Reference",
        "Customer Name",
        "Customer Phone",
        "Delivery Address",
        "Payment Method",
        "COD Amount",
        "Priority",
        "Status",
        "Assigned Driver",
        "Assigned Courier",
        "Created By",
        "Notes",
        "Created At",
        "Updated At",
      ];

      const xlsRows = [
        headers.join("\t"),
        ...formattedDeliveries.map((delivery) =>
          [
            delivery.id,
            delivery.reference,
            delivery.customerName,
            delivery.customerPhone,
            delivery.deliveryAddress,
            delivery.paymentMethod,
            delivery.codAmount,
            delivery.priority,
            delivery.status,
            delivery.assignedDriver,
            delivery.assignedCourier,
            delivery.createdBy,
            delivery.notes,
            new Date(delivery.createdAt).toISOString(),
            new Date(delivery.updatedAt).toISOString(),
          ].join("\t")
        ),
      ];

      const xlsContent = xlsRows.join("\n");

      return new NextResponse(xlsContent, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.ms-excel",
          "Content-Disposition": `attachment; filename="bulk-search-${
            new Date().toISOString().split("T")[0]
          }.xls"`,
        },
      });
    }

    return NextResponse.json({
      deliveries: formattedDeliveries,
      count: formattedDeliveries.length,
    });
  } catch (error) {
    console.error("Bulk search error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
