import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { getAuthUser } from "@/lib/session";
import {
  PDFDocument as PDFLibDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type RGB,
} from "pdf-lib";

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

    // PDF (using pdf-lib to avoid filesystem font lookups)
    if (format.toLowerCase() === "pdf") {
      const pdfDoc = await PDFLibDocument.create();
      const pageSize = { width: 595.28, height: 841.89 }; // A4 in points
      let page = pdfDoc.addPage([pageSize.width, pageSize.height]);

      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const margin = 40;
      const lineHeight = 16;
      const headerLineHeight = 18;
      const titleFontSize = 18;
      const textFontSize = 11;

      let cursorY = page.getHeight() - margin;

      const drawText = (
        text: string,
        x: number,
        y: number,
        options?: { size?: number; font?: PDFFont; color?: RGB }
      ) => {
        page.drawText(text, {
          x,
          y,
          size: options?.size ?? textFontSize,
          font: options?.font ?? helvetica,
          color: options?.color ?? rgb(0, 0, 0),
        });
      };

      // Title
      const title = "Cash on Delivery (COD) Report";
      const titleWidth = helvetica.widthOfTextAtSize(title, titleFontSize);
      drawText(
        title,
        (page.getWidth() - titleWidth) / 2,
        cursorY - titleFontSize,
        { size: titleFontSize, font: helveticaBold }
      );
      cursorY -= titleFontSize + 6;

      const subTitle = `Date Range: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      const subTitleWidth = helvetica.widthOfTextAtSize(subTitle, textFontSize);
      drawText(
        subTitle,
        (page.getWidth() - subTitleWidth) / 2,
        cursorY - textFontSize
      );
      cursorY -= textFontSize + 14;

      // Table
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
      const startX = margin;

      const columnX: number[] = [];
      let accX = startX;
      for (let i = 0; i < columnWidths.length; i += 1) {
        columnX.push(accX);
        accX += columnWidths[i];
      }

      const drawHeader = () => {
        const y = cursorY;
        header.forEach((text, idx) => {
          drawText(text, columnX[idx], y - headerLineHeight, {
            font: helveticaBold,
            size: 12,
          });
        });
        // header underline
        page.drawLine({
          start: { x: startX, y: y - headerLineHeight - 2 },
          end: {
            x: startX + columnWidths.reduce((a, b) => a + b, 0),
            y: y - headerLineHeight - 2,
          },
          thickness: 0.5,
          color: rgb(0.9, 0.91, 0.92),
        });
        cursorY = y - headerLineHeight - 10;
      };

      const drawCell = (
        text: string,
        idx: number,
        y: number,
        align: "left" | "right" = "left"
      ) => {
        const cellWidth = columnWidths[idx] ?? 80;
        const font = helvetica;
        const size = textFontSize;
        let x = columnX[idx];
        if (align === "right") {
          const textWidth = font.widthOfTextAtSize(text, size);
          x = x + cellWidth - textWidth - 2;
        }
        drawText(text, x, y - size, { font, size });
      };

      const ensureSpace = (need: number) => {
        if (cursorY - need < margin) {
          page = pdfDoc.addPage([pageSize.width, pageSize.height]);
          cursorY = page.getHeight() - margin;
          // redraw header on new page
          drawHeader();
        }
      };

      // Header
      drawHeader();

      // Rows
      for (const d of processedDeliveries) {
        ensureSpace(lineHeight);
        const y = cursorY;
        drawCell(String(d.reference ?? ""), 0, y);
        drawCell(String(d.customerName ?? ""), 1, y);
        drawCell(String(d.customerPhone ?? ""), 2, y);
        drawCell(String((d.codAmount || 0).toLocaleString()), 3, y, "right");
        drawCell(String((d.deliveryFee || 0).toLocaleString()), 4, y, "right");
        drawCell(String(d.status ?? "").toUpperCase(), 5, y);
        drawCell(String(d.assignedDriver ?? ""), 6, y);
        drawCell(new Date(d.createdAt).toLocaleDateString(), 7, y);
        cursorY -= lineHeight;
      }

      // Totals
      const totalCOD = processedDeliveries.reduce(
        (sum, d) => sum + (Number(d.codAmount) || 0),
        0
      );
      const totalFee = processedDeliveries.reduce(
        (sum, d) => sum + (Number(d.deliveryFee) || 0),
        0
      );

      ensureSpace(lineHeight * 2);
      // Place totals at left margin
      drawText(
        `Total COD: ₹${totalCOD.toLocaleString()}`,
        startX,
        cursorY - textFontSize,
        {
          font: helveticaBold,
        }
      );
      cursorY -= lineHeight;
      drawText(
        `Total Delivery Fees: ₹${totalFee.toLocaleString()}`,
        startX,
        cursorY - textFontSize,
        {
          font: helveticaBold,
        }
      );

      const bytes = await pdfDoc.save();
      const arrayBuffer = new ArrayBuffer(bytes.length);
      new Uint8Array(arrayBuffer).set(bytes);
      return new NextResponse(arrayBuffer, {
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
