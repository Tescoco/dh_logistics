import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { getAuthUser } from "@/lib/session";

export const runtime = "nodejs";

const UpdateDeliverySchema = z.object({
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().min(3).optional(),
  deliveryAddress: z.string().min(3).optional(),
  deliveryCity: z.string().optional(),
  deliveryDistrict: z.string().optional(),
  deliveryPostalCode: z.string().optional(),
  senderName: z.string().optional(),
  senderPhone: z.string().optional(),
  senderAddress: z.string().optional(),
  senderCity: z.string().optional(),
  senderDistrict: z.string().optional(),
  senderPostalCode: z.string().optional(),
  weightKg: z.number().optional(),
  dimensions: z.string().optional(),
  packageType: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(["standard", "express"]).optional(),
  paymentMethod: z.enum(["prepaid", "cod"]).optional(),
  deliveryFee: z.number().optional(),
  codAmount: z.number().optional(),
  returnOrderRate: z.number().optional(),
  codPaymentStatus: z.enum(["pending", "paid", "returned"]).optional(),
  codPaidAmount: z.number().optional(),
  codPaidDate: z.string().optional(), // ISO date string
  codNotes: z.string().optional(),
  specialInstructions: z.array(z.string()).optional(),
  notes: z.string().optional(),
  status: z
    .enum([
      "pending",
      "assigned",
      "in_transit",
      "delivered",
      "returned",
      "future_delivery",
      "rto",
      "lost_damaged",
      "cancelled",
    ])
    .optional(),
  assignedDriverId: z.string().optional(),
  thirdPartyShipmentNumber: z.string().optional(),
  serviceType: z.enum(["1", "5", "9"]).optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(_req: NextRequest, context: any) {
  await connectToDatabase();
  const { id } = await context.params;
  const delivery = await Delivery.findById(id)
    .populate("assignedDriverId", "firstName lastName")
    .lean();
  if (!delivery)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ delivery });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: NextRequest, context: any) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const input = UpdateDeliverySchema.parse(body);
    const { id } = await context.params;

    // Get current delivery for comparison
    const currentDelivery = await Delivery.findById(id).lean();
    if (!currentDelivery)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Build activity log entries for changes
    const activityEntries = [];

    // Check for status change
    if (input.status && input.status !== currentDelivery.status) {
      activityEntries.push({
        action: "status_changed",
        performedBy: auth.userId,
        performedAt: new Date(),
        details: `Status changed from ${currentDelivery.status} to ${input.status}`,
        oldValue: currentDelivery.status,
        newValue: input.status,
      });
    }

    // Check for driver assignment change
    if (
      input.assignedDriverId &&
      input.assignedDriverId !== currentDelivery.assignedDriverId?.toString()
    ) {
      activityEntries.push({
        action: "driver_assigned",
        performedBy: auth.userId,
        performedAt: new Date(),
        details: `Driver assignment changed`,
        oldValue: currentDelivery.assignedDriverId?.toString() || "None",
        newValue: input.assignedDriverId,
      });
    }

    // Check for COD payment status change
    if (
      input.codPaymentStatus &&
      input.codPaymentStatus !== currentDelivery.codPaymentStatus
    ) {
      activityEntries.push({
        action: "cod_payment_updated",
        performedBy: auth.userId,
        performedAt: new Date(),
        details: `COD payment status changed from ${currentDelivery.codPaymentStatus} to ${input.codPaymentStatus}`,
        oldValue: currentDelivery.codPaymentStatus,
        newValue: input.codPaymentStatus,
      });
    }

    // Check for COD amount change
    if (
      input.codAmount !== undefined &&
      input.codAmount !== currentDelivery.codAmount
    ) {
      activityEntries.push({
        action: "cod_amount_updated",
        performedBy: auth.userId,
        performedAt: new Date(),
        details: `COD amount changed from ${
          currentDelivery.codAmount || 0
        } to ${input.codAmount}`,
        oldValue: String(currentDelivery.codAmount || 0),
        newValue: String(input.codAmount),
      });
    }

    // Add general details update entry if other fields changed
    const otherFields = Object.keys(input).filter(
      (key) => !["status", "codPaymentStatus", "codAmount"].includes(key)
    );

    if (otherFields.length > 0) {
      // Create detailed activity entries for each changed field
      otherFields.forEach((field) => {
        const oldValue = currentDelivery[field as keyof typeof currentDelivery];
        const newValue = input[field as keyof typeof input];

        // Only add entry if the value actually changed
        if (oldValue !== newValue) {
          // Special handling for notes to make them more user-friendly
          if (field === "notes") {
            activityEntries.push({
              action: "note_added",
              performedBy: auth.userId,
              performedAt: new Date(),
              details: `Note added: ${newValue}`,
              oldValue: String(oldValue || ""),
              newValue: String(newValue || ""),
            });
          } else {
            activityEntries.push({
              action: "details_updated",
              performedBy: auth.userId,
              performedAt: new Date(),
              details: `${field} changed from "${oldValue || "empty"}" to "${
                newValue || "empty"
              }"`,
              oldValue: String(oldValue || ""),
              newValue: String(newValue || ""),
            });
          }
        }
      });
    }

    const updateData = { ...input };

    // Check if driver is COD logistics and create order through their API
    if (
      input.assignedDriverId === "68c8103f91e0438730fbfc28" &&
      input.assignedDriverId !== currentDelivery.assignedDriverId?.toString() &&
      auth.role === "admin"
    ) {
      try {
        const settingsDoc = await (
          await import("@/models/Settings")
        ).Settings.findOne().lean();
        const adminToken = (
          settingsDoc as { thirdPartyBearerToken?: string } | null
        )?.thirdPartyBearerToken as string | undefined;

        if (adminToken) {
          const body = {
            name: input.customerName || currentDelivery.customerName,
            reference: currentDelivery.reference,
            customer_email: "not-available@gmail.com",
            number: input.customerPhone || currentDelivery.customerPhone,
            address: input.deliveryAddress || currentDelivery.deliveryAddress,
            city: input.deliveryCity || currentDelivery.deliveryCity,
            amount: input.codAmount || currentDelivery.codAmount || 0,
            description: input.description || currentDelivery.description,
            branded_content: "No",
            country: 2,
            whatsapp: currentDelivery.customerWhatsApp,
            insurance: "No",
            client_id: 82589,
            location:
              input.deliveryDistrict || currentDelivery.deliveryDistrict,
            Service:
              input.serviceType === "1" ? 1 : input.serviceType === "5" ? 5 : 9,
          };

          const r = await fetch(
            "https://codsolution.co/ship/Api/order_create",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
              },
              body: JSON.stringify(body),
            }
          );

          const j = await r.json().catch(() => null);
          if (
            j &&
            (j.status === "Success" || j.status === "success") &&
            j.shipment_number
          ) {
            // Add shipment number to update data
            updateData.thirdPartyShipmentNumber = j.shipment_number;

            // Add activity log for COD logistics order creation
            activityEntries.push({
              action: "cod_logistics_order_created",
              performedBy: auth.userId,
              performedAt: new Date(),
              details: `Order created on COD logistics with shipment number: ${j.shipment_number}`,
              newValue: j.shipment_number,
            });
          } else {
            // Add activity log for failed COD logistics order creation
            activityEntries.push({
              action: "cod_logistics_order_failed",
              performedBy: auth.userId,
              performedAt: new Date(),
              details: `Failed to create order on COD logistics: ${
                j?.message || "Unknown error"
              }`,
            });
          }
        }
      } catch (e) {
        console.error("COD logistics API error", e);
        // Add activity log for API error
        activityEntries.push({
          action: "cod_logistics_api_error",
          performedBy: auth.userId,
          performedAt: new Date(),
          details: `Error calling COD logistics API: ${
            e instanceof Error ? e.message : "Unknown error"
          }`,
        });
      }
    }

    // Instead of adding $push to updateData (which is not typed for it), use findByIdAndUpdate's $push operator directly:
    let updateOps: Record<string, unknown> = { ...updateData };
    if (activityEntries.length > 0) {
      updateOps = {
        ...updateOps,
        $push: { activityLog: { $each: activityEntries } },
      };
    }

    const updated = await Delivery.findByIdAndUpdate(id, updateOps, {
      new: true,
    }).lean();

    return NextResponse.json({ delivery: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: NextRequest, context: any) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  await Delivery.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
