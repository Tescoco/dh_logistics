import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/session";
import ExcelJS from "exceljs";
import { PDFDocument, rgb } from "pdf-lib";

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

    const processedDeliveries = deliveriesData.map((d) => {
      const deliveryFee =
        d.status === "returned" || d.status === "returning"
          ? 0
          : d.deliveryFee || 0;
      const rtoAmount =
        d.status === "returned" || d.status === "returning"
          ? d.returnOrderRate || 0
          : 0;
      const codAmount = d.codAmount || 0;
      const netCodAmount = codAmount - deliveryFee - rtoAmount;

      return {
        _id: d._id,
        reference: d.reference,
        customerName: d.customerName,
        customerPhone: d.customerPhone,
        customerStoreName: d.customerStoreName,
        deliveryAddress: d.deliveryAddress,
        codAmount: codAmount,
        codPaymentStatus: d.codPaymentStatus || "pending",
        codPaidAmount: d.codPaidAmount,
        codPaidDate: d.codPaidDate,
        codNotes: d.codNotes,
        deliveryFee: deliveryFee,
        returnOrderRate: rtoAmount,
        status: d.status,
        assignedDriver:
          auth.role === "admin"
            ? extractAssignedDriverName(d.assignedDriverId) ?? "Unassigned"
            : "",
        createdAt: d.createdAt,
        netCodAmount: netCodAmount,
      };
    });

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
        "Net COD Amount",
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
        d.netCodAmount || 0,
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

    if (format.toLowerCase() === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("COD Report");

      // Define headers
      const headers = [
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
        "Net COD Amount",
        "Status",
        ...(auth.role === "admin" ? ["Assigned Driver"] : []),
        "Created Date",
      ];

      worksheet.addRow(headers);

      // Style the header row
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE6F3FF" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Add data rows
      processedDeliveries.forEach((d) => {
        const row = [
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
          d.netCodAmount || 0,
          d.status,
          ...(auth.role === "admin" ? [d.assignedDriver] : []),
          new Date(d.createdAt).toLocaleDateString(),
        ];

        const addedRow = worksheet.addRow(row);

        // Style data rows
        addedRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Format currency columns
        const codAmountCell = addedRow.getCell(
          headers.indexOf("COD Amount") + 1
        );
        codAmountCell.numFmt = '"SAR "#,##0.00';

        const paidAmountCell = addedRow.getCell(
          headers.indexOf("Paid Amount") + 1
        );
        if (paidAmountCell.value && paidAmountCell.value !== "") {
          paidAmountCell.numFmt = '"SAR "#,##0.00';
        }

        const deliveryFeeCell = addedRow.getCell(
          headers.indexOf("Delivery Fee") + 1
        );
        deliveryFeeCell.numFmt = '"SAR "#,##0.00';

        const rtoAmountCell = addedRow.getCell(
          headers.indexOf("RTO Amount") + 1
        );
        rtoAmountCell.numFmt = '"SAR "#,##0.00';

        const netCodAmountCell = addedRow.getCell(
          headers.indexOf("Net COD Amount") + 1
        );
        netCodAmountCell.numFmt = '"SAR "#,##0.00';
      });

      // Auto-fit columns
      worksheet.columns.forEach((column, colIndex) => {
        let maxLength = 0;
        worksheet.eachRow((row) => {
          const cell = row.getCell(colIndex + 1);
          const cellValue = cell.value ? cell.value.toString() : "";
          maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(maxLength + 2, 50); // Max width of 50
      });

      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    }

    if (format.toLowerCase() === "pdf") {
      const pdfDoc = await PDFDocument.create();
      let currentPage = pdfDoc.addPage([842, 595]); // A4 landscape for better table fit

      const { width, height } = currentPage.getSize();
      const fontSize = 9;
      const headerFontSize = 12;
      const margin = 40;
      let yPosition = height - margin;

      // Title
      const titleText = `COD Report - ${fromDate} to ${toDate}`.replace(
        /[^\x00-\x7F]/g,
        "?"
      );
      currentPage.drawText(titleText, {
        x: margin,
        y: yPosition,
        size: headerFontSize + 2,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;

      // Summary in a more compact format
      const totalAmount = processedDeliveries.reduce(
        (sum, d) => sum + (d.codAmount || 0),
        0
      );
      const paidAmount = processedDeliveries
        .filter((d) => d.codPaymentStatus === "paid")
        .reduce((sum, d) => sum + (d.codPaidAmount || d.codAmount || 0), 0);
      const pendingAmount = totalAmount - paidAmount;

      const summaryText = `Deliveries: ${
        processedDeliveries.length
      } | Total: SAR ${totalAmount.toFixed(2)} | Paid: SAR ${paidAmount.toFixed(
        2
      )} | Pending: SAR ${pendingAmount.toFixed(2)}`;
      currentPage.drawText(summaryText, {
        x: margin,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      yPosition -= 30;

      // Table headers with better spacing
      const headers = [
        "Reference",
        "Customer Name",
        "COD Amount",
        "Net COD Amount",
        "Payment Status",
        "Paid Amount",
        "Date",
      ];
      const colWidths = [90, 130, 80, 90, 90, 80, 70];
      const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);

      // Draw header background
      currentPage.drawRectangle({
        x: margin,
        y: yPosition - 15,
        width: tableWidth,
        height: 20,
        color: rgb(0.9, 0.9, 0.9),
      });

      let xPosition = margin + 5; // Add padding
      headers.forEach((header, index) => {
        const cleanHeader = header.replace(/[^\x00-\x7F]/g, "?");
        currentPage.drawText(cleanHeader, {
          x: xPosition,
          y: yPosition - 5,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
        xPosition += colWidths[index];
      });

      yPosition -= 25;

      // Table data with proper pagination
      let rowCount = 0;
      const maxRowsPerPage = 20;

      processedDeliveries.forEach((d) => {
        // Check if we need a new page
        if (rowCount >= maxRowsPerPage || yPosition < margin + 30) {
          currentPage = pdfDoc.addPage([842, 595]);
          yPosition = height - margin - 50; // Leave space for continuation header
          rowCount = 0;

          // Add continuation header
          currentPage.drawText("COD Report (continued)", {
            x: margin,
            y: height - margin,
            size: headerFontSize,
            color: rgb(0, 0, 0),
          });

          // Redraw table headers
          currentPage.drawRectangle({
            x: margin,
            y: yPosition - 15,
            width: tableWidth,
            height: 20,
            color: rgb(0.9, 0.9, 0.9),
          });

          xPosition = margin + 5;
          headers.forEach((header, index) => {
            const cleanHeader = header.replace(/[^\x00-\x7F]/g, "?");
            currentPage.drawText(cleanHeader, {
              x: xPosition,
              y: yPosition - 5,
              size: fontSize,
              color: rgb(0, 0, 0),
            });
            xPosition += colWidths[index];
          });
          yPosition -= 25;
        }

        // Draw alternating row background
        if (rowCount % 2 === 0) {
          currentPage.drawRectangle({
            x: margin,
            y: yPosition - 12,
            width: tableWidth,
            height: 15,
            color: rgb(0.98, 0.98, 0.98),
          });
        }

        xPosition = margin + 5;

        const rowData = [
          d.reference || "",
          (d.customerName || "").length > 20
            ? (d.customerName || "").substring(0, 17) + "..."
            : d.customerName || "",
          `SAR ${(d.codAmount || 0).toFixed(2)}`,
          `SAR ${(d.netCodAmount || 0).toFixed(2)}`,
          (d.codPaymentStatus || "pending").toUpperCase(),
          d.codPaidAmount ? `SAR ${d.codPaidAmount.toFixed(2)}` : "-",
          d.codPaidDate ? new Date(d.codPaidDate).toLocaleDateString() : "-",
        ];

        rowData.forEach((data, index) => {
          const cleanText = String(data)
            .replace(/[^\x00-\x7F]/g, "?")
            .substring(0, 25); // Prevent text overflow

          currentPage.drawText(cleanText, {
            x: xPosition,
            y: yPosition,
            size: fontSize - 1,
            color: rgb(0, 0, 0),
          });
          xPosition += colWidths[index];
        });

        yPosition -= 15;
        rowCount++;
      });

      const pdfBytes = await pdfDoc.save();

      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
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
