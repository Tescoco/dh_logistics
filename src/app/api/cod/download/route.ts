import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { getAuthUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const deliveryIds = JSON.parse(formData.get("deliveryIds") as string);
    const format = formData.get("format") as string;
    const fromDate = formData.get("fromDate") as string;
    const toDate = formData.get("toDate") as string;

    // Get the filtered deliveries by IDs
    const deliveriesData = await Delivery.find({
      _id: { $in: deliveryIds },
      paymentMethod: "cod",
    })
      .populate("assignedDriverId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    function extractAssignedDriverName(value: unknown): string | undefined {
      if (value && typeof value === "object" && "firstName" in value) {
        const firstName = (value as { firstName?: unknown }).firstName;
        const lastName = (value as { lastName?: unknown }).lastName;
        if (typeof firstName === "string") {
          return lastName && typeof lastName === "string"
            ? `${firstName} ${lastName}`.trim()
            : firstName;
        }
      }
      return undefined;
    }

    const processedDeliveries = deliveriesData.map((d) => ({
      _id: d._id,
      reference: d.reference,
      customerName: d.customerName,
      customerPhone: d.customerPhone,
      customerStoreName: d.customerStoreName,
      deliveryAddress: d.deliveryAddress,
      codAmount: d.codAmount,
      codPaymentStatus: d.codPaymentStatus || "pending",
      codPaidAmount: d.codPaidAmount,
      codPaidDate: d.codPaidDate,
      codNotes: d.codNotes,
      deliveryFee: d.deliveryFee,
      returnOrderRate: d.returnOrderRate,
      status: d.status,
      assignedDriver:
        auth.role === "admin"
          ? extractAssignedDriverName(d.assignedDriverId) ?? "Unassigned"
          : "",
      createdAt: d.createdAt,
    }));

    const filename = `COD_Report_${fromDate}_to_${toDate}`;

    if (format.toLowerCase() === "csv") {
      const csvHeaders = [
        "Reference",
        "Customer Name",
        "Store Name",
        "Customer Phone",
        "Delivery Address",
        "COD Amount",
        "Payment Status",
        "Paid Amount",
        "Paid Date",
        "Delivery Fee",
        "RTO Amount",
        "Status",
        auth.role === "admin" ? "Assigned Driver" : "",
        "Created Date",
      ];

      const csvRows = processedDeliveries.map((d) => [
        d.reference,
        d.customerName,
        d.customerStoreName || "",
        d.customerPhone,
        d.deliveryAddress,
        d.codAmount || 0,
        d.codPaymentStatus || "pending",
        d.codPaidAmount || "",
        d.codPaidDate ? new Date(d.codPaidDate).toLocaleDateString() : "",
        d.deliveryFee || 0,
        d.returnOrderRate || 0,
        d.status,
        auth.role === "admin" ? d.assignedDriver : "",
        new Date(d.createdAt).toLocaleDateString(),
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) =>
          row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    // For other formats, return a simple response for now
    return NextResponse.json({
      message: "Download format not yet implemented",
      deliveries: processedDeliveries,
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to generate download" },
      { status: 500 }
    );
  }
}
