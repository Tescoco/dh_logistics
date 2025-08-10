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
  const deliveriesData = await Delivery.find(match)
    .populate("assignedDriverId", "name email")
    .sort({ createdAt: -1 })
    .lean();

  function extractAssignedDriverName(value: unknown): string | undefined {
    if (value && typeof value === "object" && "name" in value) {
      const n = (value as { name?: unknown }).name;
      return typeof n === "string" ? n : undefined;
    }
    return undefined;
  }

  const processedDeliveries = deliveriesData.map((d) => ({
    _id: d._id,
    reference: d.reference,
    customerName: d.customerName,
    customerPhone: d.customerPhone,
    deliveryAddress: d.deliveryAddress,
    codAmount: d.codAmount,
    deliveryFee: d.deliveryFee,
    status: d.status,
    assignedDriver:
      extractAssignedDriverName(d.assignedDriverId) ?? "Unassigned",
    createdAt: d.createdAt,
  }));

  // Handle download requests
  if (download && format) {
    const filename = `COD_Report_${start.toISOString().split("T")[0]}_to_${
      end.toISOString().split("T")[0]
    }`;

    if (format.toLowerCase() === "csv") {
      const csvHeaders = [
        "Reference",
        "Customer Name",
        "Customer Phone",
        "Delivery Address",
        "COD Amount",
        "Delivery Fee",
        "Status",
        "Assigned Driver",
        "Created Date",
      ];

      const csvRows = processedDeliveries.map((d) => [
        d.reference,
        d.customerName,
        d.customerPhone,
        d.deliveryAddress,
        d.codAmount || 0,
        d.deliveryFee || 0,
        d.status,
        d.assignedDriver,
        new Date(d.createdAt).toLocaleDateString(),
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) =>
          row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    // Excel (XLSX)
    if (format.toLowerCase() === "excel") {
      const ExcelModule = await import("exceljs");
      const workbook = new ExcelModule.Workbook();
      const worksheet = workbook.addWorksheet("COD Report");

      worksheet.columns = [
        { header: "Reference", key: "reference", width: 18 },
        { header: "Customer Name", key: "customerName", width: 24 },
        { header: "Customer Phone", key: "customerPhone", width: 16 },
        { header: "Delivery Address", key: "deliveryAddress", width: 40 },
        { header: "COD Amount", key: "codAmount", width: 14 },
        { header: "Delivery Fee", key: "deliveryFee", width: 14 },
        { header: "Status", key: "status", width: 14 },
        { header: "Assigned Driver", key: "assignedDriver", width: 20 },
        { header: "Created Date", key: "createdAt", width: 16 },
      ];

      processedDeliveries.forEach((d) => {
        worksheet.addRow({
          reference: d.reference,
          customerName: d.customerName,
          customerPhone: d.customerPhone,
          deliveryAddress: d.deliveryAddress,
          codAmount: d.codAmount || 0,
          deliveryFee: d.deliveryFee || 0,
          status: d.status,
          assignedDriver: d.assignedDriver,
          createdAt: new Date(d.createdAt).toLocaleDateString(),
        });
      });

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };

      const arrayBuffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
      const body = new Uint8Array(arrayBuffer);

      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    }

    // PDF
    if (format.toLowerCase() === "pdf") {
      const { default: PDFDocument } = await import("pdfkit");
      const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({ size: "A4", margin: 40 });
          const buffers: Buffer[] = [];
          doc.on("data", (chunk: unknown) => buffers.push(chunk as Buffer));
          doc.on("end", () => resolve(Buffer.concat(buffers)));

          // Title
          doc
            .fontSize(18)
            .text("Cash on Delivery (COD) Report", { align: "center" });
          doc.moveDown(0.5);
          doc
            .fontSize(11)
            .text(
              `Date Range: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
              { align: "center" }
            );
          doc.moveDown(1);

          // Table Header
          const header = [
            "Reference",
            "Customer",
            "Phone",
            "COD",
            "Fee",
            "Status",
            "Driver",
            "Date",
          ];

          const columnWidths = [90, 120, 80, 60, 60, 70, 90, 70];

          function drawRow(values: (string | number)[], isHeader = false) {
            const startX = doc.x;
            const startY = doc.y;
            values.forEach((val, idx) => {
              const width = columnWidths[idx] ?? 80;
              const cellText = String(val ?? "");
              const options = {
                width,
                continued: idx < values.length - 1,
                align: idx === 3 || idx === 4 ? "right" : "left",
              } as const;
              if (isHeader) doc.font("Helvetica-Bold");
              doc.text(cellText, options);
              if (isHeader) doc.font("Helvetica");
            });
            doc.moveDown(0.4);
            // draw a subtle line under header
            if (isHeader) {
              doc
                .moveTo(startX, startY + 14)
                .lineTo(
                  startX + columnWidths.reduce((a, b) => a + b, 0),
                  startY + 14
                )
                .strokeColor("#e5e7eb")
                .stroke();
              doc.moveDown(0.2);
            }
          }

          drawRow(header, true);

          processedDeliveries.forEach((d) => {
            drawRow([
              d.reference,
              d.customerName,
              d.customerPhone,
              (d.codAmount || 0).toLocaleString(),
              (d.deliveryFee || 0).toLocaleString(),
              String(d.status).toUpperCase(),
              d.assignedDriver,
              new Date(d.createdAt).toLocaleDateString(),
            ]);
          });

          // Totals
          const totalCOD = processedDeliveries.reduce(
            (sum, d) => sum + (Number(d.codAmount) || 0),
            0
          );
          const totalFee = processedDeliveries.reduce(
            (sum, d) => sum + (Number(d.deliveryFee) || 0),
            0
          );
          doc.moveDown(1);
          doc
            .font("Helvetica-Bold")
            .text(`Total COD: ₹${totalCOD.toLocaleString()}`)
            .text(`Total Delivery Fees: ₹${totalFee.toLocaleString()}`)
            .font("Helvetica");

          doc.end();
        } catch (err) {
          reject(err);
        }
      });

      const pdfUint8 = new Uint8Array(pdfBuffer);
      return new NextResponse(pdfUint8, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
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
