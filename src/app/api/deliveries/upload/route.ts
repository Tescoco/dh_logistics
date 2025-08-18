import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/session";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

// Expected CSV headers: reference,customerName,customerPhone,senderName,senderPhone,senderAddress,senderCity,senderDistrict,senderPostalCode,deliveryAddress,deliveryCity,deliveryDistrict,deliveryPostalCode,packageType,description,priority,paymentMethod,codAmount,notes
// Example:
// REF001,John Doe,+1234567890,Jane Sender,+9876543210,789 Sender St,Riyadh,Al-Malaz,12345,123 Main St,Riyadh,Al-Malaz,12345,Package,Description,Standard,COD,10,50,Notes
// REF002,Jane Smith,+9876543210,Bob Sender,+1234567890,456 Sender Ave,Jeddah,Al-Hamra,54321,456 Oak Ave,Jeddah,Al-Hamra,54321,Document,Important docs,Express,Prepaid,15,0,Handle with care
export async function POST(req: NextRequest) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      return NextResponse.json({ error: "Empty CSV" }, { status: 400 });
    }
    let startIdx = 0;
    const headerLower = lines[0].toLowerCase();
    let headerUsed = false;

    // Check if first line looks like headers (contains common delivery fields)
    const commonFields = [
      "reference",
      "customer",
      "phone",
      "address",
      "package",
      "description",
    ];
    const hasCommonFields = commonFields.some((field) =>
      headerLower.includes(field)
    );

    if (hasCommonFields) {
      startIdx = 1;
      headerUsed = true;
    } else {
      // If first line doesn't look like headers, check if it has data-like content
      const firstLineParts = lines[0].split(",").map((p) => p.trim());
      if (
        firstLineParts.length > 3 &&
        firstLineParts.every((part) => part.length > 0)
      ) {
        // Assume first line is data, create generic headers
        startIdx = 0;
        headerUsed = false;
      } else {
        // Assume first line is headers
        startIdx = 1;
        headerUsed = true;
      }
    }
    const sender = await User.findById(auth.userId);
    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 400 });
    }
    const senderName = `${sender.firstName ?? ""} ${
      sender.lastName ?? ""
    }`.trim();
    const senderPhone: string = sender.phone ?? "";

    type NewDelivery = {
      reference: string;
      customerName: string;
      customerPhone: string;
      senderName: string;
      senderPhone: string;
      senderAddress?: string;
      senderCity?: string;
      senderDistrict?: string;
      senderPostalCode?: string;
      deliveryAddress: string;
      deliveryCity?: string;
      deliveryDistrict?: string;
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

    // fetech delivery fee from user record
    const deliveryFee = sender.deliveryFee;

    const deliveries: NewDelivery[] = [];
    for (let i = startIdx; i < lines.length; i++) {
      const raw = lines[i];
      const parts = raw.split(",").map((p) => p.trim());

      // Basic validation for delivery data
      if (parts.length < 3) continue; // Skip rows with insufficient data

      const reference = parts[0] ?? "";
      const customerName = parts[1] ?? "";
      const customerPhone = parts[2] ?? "";
      const senderNameCsv = parts[3] ?? "";
      const senderPhoneCsv = parts[4] ?? "";
      const senderAddressCsv = parts[5] ?? "";
      const senderCityCsv = parts[6] ?? "";
      const senderDistrictCsv = parts[7] ?? "";
      const senderPostalCodeCsv = parts[8] ?? "";
      const deliveryAddress = parts[9] ?? "";
      const deliveryCity = parts[10] ?? "";
      const deliveryDistrict = parts[11] ?? "";
      const deliveryPostalCode = parts[12] ?? "";
      const packageType = parts[13] ?? "Package";
      const description = parts[14] ?? "";
      const priority = parts[15] ?? "standard";
      const paymentMethod = parts[16] ?? "prepaid";
      const codAmount = parseFloat(parts[17]) || 0;
      const notes = parts[18] ?? "";
      const deliveryFee = parseFloat(parts?.[19] ?? "0") || sender.deliveryFee;

      // Validate required fields
      if (!reference.trim() || !customerName.trim() || !customerPhone.trim()) {
        continue; // Skip invalid rows
      }

      // Basic phone validation
      if (!/^[+]?[0-9\s\-()]{7,15}$/.test(customerPhone.trim())) {
        continue; // Skip invalid phone numbers
      }

      deliveries.push({
        reference: reference.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        senderName: senderNameCsv.trim() || senderName,
        senderPhone: senderPhoneCsv.trim() || senderPhone,
        senderAddress: senderAddressCsv.trim() || undefined,
        senderCity: senderCityCsv.trim() || undefined,
        senderDistrict: senderDistrictCsv.trim() || undefined,
        senderPostalCode: senderPostalCodeCsv.trim() || undefined,
        deliveryAddress: deliveryAddress.trim(),
        deliveryCity: deliveryCity.trim() || undefined,
        deliveryDistrict: deliveryDistrict.trim() || undefined,
        deliveryPostalCode: deliveryPostalCode.trim() || undefined,
        packageType: packageType.trim(),
        description: description.trim(),
        priority: priority.trim(),
        paymentMethod: paymentMethod.trim(),
        deliveryFee,
        codAmount,
        notes: notes.trim(),
        status: "pending",
        createdById: auth.userId,
        createdAt: new Date(),
      });
    }
    if (deliveries.length === 0) {
      return NextResponse.json(
        {
          error:
            "No valid rows found. Please check your CSV format and required fields.",
        },
        { status: 400 }
      );
    }

    // bulk check if reference already exists
    const existingReferences = await Delivery.find({
      reference: { $in: deliveries.map((d) => d.reference) },
    });
    const existingReferencesMap = new Map(
      existingReferences.map((d) => [d.reference, d])
    );

    // filter out deliveries that already exist
    const newDeliveries = deliveries.filter(
      (d) => !existingReferencesMap.has(d.reference)
    );

    // Create deliveries in batch
    try {
      const result = await Delivery.insertMany(newDeliveries);
      return NextResponse.json({
        ok: true,
        processed: deliveries.length,
        created: result.length,
        message: `Successfully created ${result.length} deliveries`,
      });
    } catch (dbError: unknown) {
      console.error("Database insertion error:", dbError);

      let specificError = "Failed to create deliveries.";

      // Narrow error type when possible
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
    console.error("CSV upload error", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
