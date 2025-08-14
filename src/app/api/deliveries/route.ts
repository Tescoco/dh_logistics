import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/session";

const CreateDeliverySchema = z.object({
  reference: z.string().min(3),
  customerName: z.string().min(1),
  customerPhone: z.string().min(3),
  deliveryAddress: z.string().min(3),
  senderName: z.string().optional(),
  senderPhone: z.string().optional(),
  senderAddress: z.string().optional(),
  weightKg: z.number().optional(),
  dimensions: z.string().optional(),
  packageType: z.string().optional(),
  description: z.string().min(1),
  priority: z.enum(["standard", "express"]).optional(),
  paymentMethod: z.enum(["prepaid", "cod"]).optional(),
  deliveryFee: z.number().optional(),
  codAmount: z.number().optional(),
  specialInstructions: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isDraft: z.boolean().optional(),
  assignedDriverId: z
    .string()
    .regex(/^[a-f0-9]{24}$/i, { message: "Invalid driver id format" })
    .optional(),
});

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const payment = url.searchParams.get("payment");
  const tab = url.searchParams.get("tab");
  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  if (payment) query.paymentMethod = payment;
  // if tab is internal get all deliveries with assignedDriverId that is not equal to 68992b3ad5eb3b93c40396dc
  if (tab === "internal") {
    query.assignedDriverId = { $ne: "68992b3ad5eb3b93c40396dc" };
  }
  // if tab is cod get all deliveries with assignedDriverId that is equal to 68992b3ad5eb3b93c40396dc
  if (tab === "cod") {
    query.assignedDriverId = "68992b3ad5eb3b93c40396dc";
  }
  // Scope to the requesting user unless admin
  if (auth.role !== "admin") query.createdById = auth.userId;

  const deliveries = await Delivery.find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return NextResponse.json({ deliveries });
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    // fetech delivery fee from user record
    const user = await User.findById(auth.userId).select("deliveryFee").lean();

    const input = CreateDeliverySchema.parse({
      ...body,
      deliveryFee: user?.deliveryFee || 0,
    });
    // If a driver is specified, ensure it exists and has role 'driver'
    if (input.assignedDriverId) {
      const driver = await User.findById(input.assignedDriverId)
        .select("_id role isActive")
        .lean();
      if (!driver) {
        return NextResponse.json(
          { error: "Selected driver not found" },
          { status: 400 }
        );
      }
      if (driver.role !== "driver") {
        return NextResponse.json(
          { error: "Selected user is not a driver" },
          { status: 400 }
        );
      }
      // Optionally ensure active
      // if (driver.isActive === false) {
      //   return NextResponse.json({ error: "Selected driver is inactive" }, { status: 400 });
      // }
    }
    const doc = await Delivery.create({ ...input, createdById: auth.userId });

    // If assigned to the special COD driver, forward to 3rd party using stored admin token
    try {
      if (input.assignedDriverId === "68992b3ad5eb3b93c40396dc") {
        const settingsDoc = await (
          await import("@/models/Settings")
        ).Settings.findOne().lean();
        const adminToken = (
          settingsDoc as { thirdPartyBearerToken?: string } | null
        )?.thirdPartyBearerToken as string | undefined;
        if (adminToken) {
          const body = {
            name: input.customerName,
            reference: input.reference,
            customer_email: "testorder@gmail.com",
            number: input.customerPhone,
            address: input.deliveryAddress,
            city: "Riyadh",
            amount: input.codAmount || 0,
            description: input.description,
            branded_content: "No",
            country: 2,
            whatsapp: input.customerPhone,
            insurance: "No",
            client_id: 82589,
            location: "",
            Service: 1,
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
            await Delivery.findByIdAndUpdate(doc._id, {
              $set: { thirdPartyShipmentNumber: j.shipment_number },
            });
          }
        }
      }
    } catch {}

    return NextResponse.json({ id: doc._id.toString() }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error("Create delivery error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
