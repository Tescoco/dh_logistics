import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { getAuthUser } from "@/lib/session";

export const runtime = "nodejs";

// Returns aggregate COD stats for a given date range
export async function GET(req: NextRequest) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const detailed = url.searchParams.get("detailed") === "true";
  const format = url.searchParams.get("format");
  const download = url.searchParams.get("download") === "true";
  const start = from ? new Date(from) : new Date(0);
  const end = to ? new Date(to) : new Date();

  type MatchFilter = {
    paymentMethod: "cod";
    createdAt: { $gte: Date; $lte: Date };
    createdById?: string;
  };
  const match: MatchFilter = {
    paymentMethod: "cod",
    createdAt: { $gte: start, $lte: end },
  };
  if (auth.role !== "admin") match.createdById = auth.userId;

  // Get deliveries data
  const deliveries = await Delivery.find(match)
    .populate("assignedDriverId", "name email")
    .sort({ createdAt: -1 })
    .lean();

  const processedDeliveries = deliveries.map((d) => ({
    _id: d._id,
    reference: d.reference,
    customerName: d.customerName,
    customerPhone: d.customerPhone,
    deliveryAddress: d.deliveryAddress,
    codAmount: d.codAmount,
    deliveryFee: d.deliveryFee,
    status: d.status,
    assignedDriver: d.assignedDriverId
      ? (d.assignedDriverId as any).name
      : "Unassigned",
    createdAt: d.createdAt,
  }));

  // Handle download requests
  if (download && format) {
    const filename = `COD_Report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}`;
    
    if (format.toLowerCase() === 'csv') {
      const csvHeaders = [
        'Reference',
        'Customer Name',
        'Customer Phone',
        'Delivery Address',
        'COD Amount',
        'Delivery Fee',
        'Status',
        'Assigned Driver',
        'Created Date'
      ];
      
      const csvRows = processedDeliveries.map(d => [
        d.reference,
        d.customerName,
        d.customerPhone,
        d.deliveryAddress,
        d.codAmount || 0,
        d.deliveryFee || 0,
        d.status,
        d.assignedDriver,
        new Date(d.createdAt).toLocaleDateString()
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }
    
    // For PDF and Excel, return a simple message for now
    // You can implement proper PDF/Excel generation libraries later
    if (format.toLowerCase() === 'pdf' || format.toLowerCase() === 'excel') {
      const message = `${format.toUpperCase()} download functionality not yet implemented. Please use CSV format.`;
      return new NextResponse(message, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${filename}.txt"`,
        },
      });
    }
  }

  // If detailed data is requested, return the actual deliveries
  if (detailed) {
    return NextResponse.json({
      deliveries: processedDeliveries,
    });
  }

  // Return aggregate stats
  const [totalAmountAgg, deliveries, pendingAmountAgg, collectedAmountAgg] =
    await Promise.all([
      Delivery.aggregate([
        { $match: match },
        { $group: { _id: null, sum: { $sum: "$codAmount" } } },
      ]),
      Delivery.countDocuments(match),
      Delivery.aggregate([
        {
          $match: {
            ...match,
            status: { $in: ["pending", "in_transit", "assigned"] },
          },
        },
        { $group: { _id: null, sum: { $sum: "$codAmount" } } },
      ]),
      Delivery.aggregate([
        { $match: { ...match, status: "delivered" } },
        { $group: { _id: null, sum: { $sum: "$codAmount" } } },
      ]),
    ]);

  const totalAmount = totalAmountAgg[0]?.sum ?? 0;
  const pendingAmount = pendingAmountAgg[0]?.sum ?? 0;
  const collectedAmount = collectedAmountAgg[0]?.sum ?? 0;

  return NextResponse.json({
    totalAmount,
    deliveries,
    pendingAmount,
    collectedAmount,
  });
}
