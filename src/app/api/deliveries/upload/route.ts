import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/session";
import { ObjectId } from "mongodb";
import { parseFile, validateDeliveryRow } from "@/lib/fileParser";

export const runtime = "nodejs";

// Supported file formats: CSV and XLSX
// Expected headers: reference,customerName,customerPhone,senderName,senderPhone,senderAddress,senderCity,senderPostalCode,deliveryAddress,deliveryCity,deliveryPostalCode,packageType,description,priority,paymentMethod,deliveryFee,codAmount,notes
// Example CSV:
// REF001,John Doe,+1234567890,Jane Sender,+9876543210,789 Sender St,Riyadh,Al-Malaz,12345,123 Main St,Riyadh,Al-Malaz,12345,Package,Description,Standard,COD,10,50,Notes
// REF002,Jane Smith,+9876543210,Bob Sender,+1234567890,456 Sender Ave,Jeddah,Al-Hamra,54321,456 Oak Ave,Jeddah,Al-Hamra,54321,Document,Important docs,Express,Prepaid,15,0,Handle with care

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const contentType = req.headers.get("content-type");
    let rows, headers, fileName, isCSV, isXLSX;

    // Check if this is JSON data (edited data) or FormData (original file upload)
    if (contentType?.includes("application/json")) {
      // Handle JSON data from edited preview
      const jsonData = await req.json();
      if (!jsonData.rows || !jsonData.headers || !jsonData.fileName) {
        return NextResponse.json(
          { error: "Missing required data: rows, headers, or fileName" },
          { status: 400 }
        );
      }

      rows = jsonData.rows;
      headers = jsonData.headers;
      fileName = jsonData.fileName.toLowerCase();
      isCSV = jsonData.fileType === "csv" || fileName.endsWith(".csv");
      isXLSX = jsonData.fileType === "xlsx" || fileName.endsWith(".xlsx");
    } else {
      // Handle FormData (original file upload - for backward compatibility)
      const form = await req.formData();
      const file = form.get("file");
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
      }

      // Validate file type
      fileName = file.name.toLowerCase();
      const fileType = file.type;
      isCSV = fileType === "text/csv" || fileName.endsWith(".csv");
      isXLSX =
        fileType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        fileName.endsWith(".xlsx");

      if (!isCSV && !isXLSX) {
        return NextResponse.json(
          {
            error: "Unsupported file type. Please upload a CSV or XLSX file.",
          },
          { status: 400 }
        );
      }

      // Parse the file
      let parseResult;
      try {
        parseResult = await parseFile(file);
      } catch (parseError) {
        return NextResponse.json(
          {
            error: `Failed to parse file: ${
              parseError instanceof Error ? parseError.message : "Unknown error"
            }`,
          },
          { status: 400 }
        );
      }

      rows = parseResult.rows;
      headers = parseResult.headers;
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: "No data rows found in the file.",
        },
        { status: 400 }
      );
    }

    // Get sender information
    const sender = await User.findById(auth.userId);
    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 400 });
    }
    const senderName = `${sender.firstName ?? ""} ${
      sender.lastName ?? ""
    }`.trim();
    const senderPhone: string = sender.phone ?? "";
    const defaultDeliveryFee = sender.deliveryFee || 0;

    type NewDelivery = {
      reference: string;
      customerName: string;
      customerPhone: string;
      customerStoreName?: string; // Store name from customer account
      senderName: string;
      senderPhone: string;
      senderAddress?: string;
      senderCity?: string;
      senderPostalCode?: string;
      deliveryAddress: string;
      deliveryCity?: string;
      deliveryPostalCode?: string;
      packageType: string;
      description: string;
      priority: string;
      paymentMethod: string;
      deliveryFee: number;
      codAmount: number;
      notes: string;
      status: string;
      createdById: string | ObjectId;
      createdAt: Date;
    };

    const deliveries: NewDelivery[] = [];
    const errors: string[] = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const validation = validateDeliveryRow(row, headers);

      if (!validation.isValid) {
        errors.push(`Row ${i + 1}: ${validation.reason}`);
        continue;
      }

      const data = validation.data!;

      deliveries.push({
        reference: data.reference,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        deliveryAddress: data.deliveryAddress,
        deliveryCity: data.deliveryCity || undefined,
        deliveryPostalCode: data.deliveryPostalCode || undefined,
        packageType: data.packageType,
        description: data.description,
        priority: data.priority || "standard",
        paymentMethod: data.paymentMethod || "cod",
        deliveryFee: data.deliveryFee || defaultDeliveryFee,
        codAmount: data.codAmount,
        notes: data.notes,
        status: "pending",
        createdById: auth.userId,
        createdAt: new Date(),
        customerStoreName: data.customerStoreName || sender.customerStoreName, // Use sender's store name
        senderName: data.senderName || senderName,
        senderPhone: data.senderPhone || senderPhone,
        senderAddress: data.senderAddress || undefined,
        senderCity: data.senderCity || undefined,
        senderPostalCode: data.senderPostalCode || undefined,
      });
    }

    if (deliveries.length === 0) {
      const errorMessage =
        errors.length > 0
          ? `No valid rows found. Errors: ${errors.slice(0, 5).join("; ")}${
              errors.length > 5 ? "..." : ""
            }`
          : "No valid rows found. Please check your file format and required fields.";

      return NextResponse.json(
        {
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    // Check for existing references
    const existingReferences = await Delivery.find({
      reference: { $in: deliveries.map((d) => d.reference) },
    });
    const existingReferencesMap = new Map(
      existingReferences.map((d) => [d.reference, d])
    );

    // Filter out deliveries that already exist
    const newDeliveries = deliveries.filter(
      (d) => !existingReferencesMap.has(d.reference)
    );

    const skippedCount = deliveries.length - newDeliveries.length;

    // Create deliveries in batch
    try {
      const result = await Delivery.insertMany(newDeliveries);

      let message = `Successfully processed ${deliveries.length} rows from ${
        isCSV ? "CSV" : "XLSX"
      } file. `;
      message += `Created ${result.length} new deliveries.`;
      if (skippedCount > 0) {
        message += ` Skipped ${skippedCount} duplicate references.`;
      }
      if (errors.length > 0) {
        message += ` ${errors.length} rows had validation errors.`;
      }

      return NextResponse.json({
        ok: true,
        processed: deliveries.length,
        created: result.length,
        skipped: skippedCount,
        errors: errors.length,
        message,
        fileType: isCSV ? "CSV" : "XLSX",
        validationErrors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Return first 10 errors
      });
    } catch (dbError: unknown) {
      console.error("Database insertion error:", dbError);

      let specificError = "Failed to create deliveries.";

      // Handle different types of database errors
      const err = dbError as
        | (Error & {
            code?: number;
            keyPattern?: Record<string, unknown>;
            keyValue?: Record<string, unknown>;
            errors?: Record<string, { message: string }>;
            name?: string;
            writeErrors?: Array<{
              code?: number;
              index: number;
              keyPattern?: Record<string, unknown>;
              keyValue?: Record<string, unknown>;
              errmsg?: string;
            }>;
          })
        | undefined;

      if (err?.code === 11000) {
        // Duplicate key error
        const duplicateField = err.keyPattern
          ? Object.keys(err.keyPattern)[0]
          : "unknown field";
        const duplicateValue = err.keyValue
          ? err.keyValue[duplicateField]
          : "unknown value";
        specificError = `Duplicate ${duplicateField}: "${duplicateValue}" already exists. Please use unique values.`;
      } else if (err?.name === "ValidationError") {
        // Mongoose validation error
        const validationErrors = err?.errors
          ? Object.values(err.errors).map((e) => e.message)
          : [];
        specificError = `Validation failed: ${validationErrors.join(", ")}`;
      } else if (err?.writeErrors && err.writeErrors.length > 0) {
        // Bulk write errors
        const writeError = err.writeErrors[0];
        if (writeError.code === 11000) {
          const duplicateField = writeError.keyPattern
            ? Object.keys(writeError.keyPattern)[0]
            : "reference";
          const duplicateValue = writeError.keyValue
            ? writeError.keyValue[duplicateField]
            : "unknown";
          specificError = `Duplicate ${duplicateField}: "${duplicateValue}" found at row ${
            writeError.index + 1
          }. Please ensure all references are unique.`;
        } else {
          specificError = `Error at row ${writeError.index + 1}: ${
            writeError.errmsg || "Invalid data format"
          }`;
        }
      } else if (err?.message) {
        // Generic error with message
        specificError = `Database error: ${err.message}`;
      }

      return NextResponse.json(
        {
          error: specificError,
          details: "Please fix the data and try again.",
        },
        { status: 400 }
      );
    }
  } catch (e) {
    console.error("File upload error", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
