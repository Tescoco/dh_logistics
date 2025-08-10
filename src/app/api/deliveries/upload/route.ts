import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/session";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

// Expected CSV headers: reference,customerName,customerPhone,deliveryAddress,packageType,description,priority,paymentMethod,deliveryFee,codAmount,notes
// Example:
// REF001,John Doe,+1234567890,123 Main St,Package,Description,Standard,COD,10,50,Notes
// REF002,Jane Smith,+9876543210,456 Oak Ave,Document,Important docs,Express,Prepaid,15,0,Handle with care
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
    const senderName = sender.firstName + " " + sender.lastName;
    const senderPhone = sender.phone;

    const deliveries: any[] = [];
    for (let i = startIdx; i < lines.length; i++) {
      const raw = lines[i];
      const parts = raw.split(",").map((p) => p.trim());

      // Basic validation for delivery data
      if (parts.length < 3) continue; // Skip rows with insufficient data

      const reference = parts[0] ?? "";
      const customerName = parts[1] ?? "";
      const customerPhone = parts[2] ?? "";
      const originAddress = parts[3] ?? "";
      const deliveryAddress = parts[4] ?? "";
      const packageType = parts[5] ?? "Package";
      const description = parts[6] ?? "";
      const priority = parts[7] ?? "standard";
      const deliveryFee = parseFloat(parts[8]) || 0;
      const codAmount = parseFloat(parts[9]) || 0;
      const notes = parts[10] ?? "";

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
        senderName: senderName,
        senderPhone: senderPhone,
        originAddress: originAddress.trim(),
        deliveryAddress: deliveryAddress.trim(),
        packageType: packageType.trim(),
        description: description.trim(),
        priority: priority.trim(),
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
    } catch (dbError: any) {
      console.error("Database insertion error:", dbError);

      let specificError = "Failed to create deliveries.";

      if (dbError.code === 11000) {
        // Duplicate key error
        const duplicateField = dbError.keyPattern
          ? Object.keys(dbError.keyPattern)[0]
          : "unknown field";
        const duplicateValue = dbError.keyValue
          ? dbError.keyValue[duplicateField]
          : "unknown value";
        specificError = `Duplicate ${duplicateField}: "${duplicateValue}" already exists. Please use unique values.`;
      } else if (dbError.name === "ValidationError") {
        // Mongoose validation error
        const validationErrors = Object.values(dbError.errors).map(
          (err: any) => err.message
        );
        specificError = `Validation failed: ${validationErrors.join(", ")}`;
      } else if (dbError.writeErrors && dbError.writeErrors.length > 0) {
        // Bulk write errors
        const writeError = dbError.writeErrors[0];
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
      } else if (dbError.message) {
        // Generic error with message
        specificError = `Database error: ${dbError.message}`;
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
