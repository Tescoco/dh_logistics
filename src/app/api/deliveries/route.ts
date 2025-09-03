import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/session";
import { ObjectId } from "mongodb";

const CreateDeliverySchema = z.object({
  reference: z.string().min(3),
  customerName: z.string().min(1),
  customerPhone: z.string().min(3),
  customerEmail: z.string().email().optional(),
  customerWhatsApp: z.string().optional(),
  customerStoreName: z.string().optional(), // Store name from customer account
  senderAddress: z.string().optional(),
  senderCity: z.string().optional(),
  senderDistrict: z.string().optional(),
  senderPostalCode: z.string().optional(),
  senderWhatsApp: z.string().optional(),
  senderName: z.string().optional(),
  senderPhone: z.string().optional(),
  deliveryAddress: z.string().min(3),
  deliveryCity: z.string().optional(),
  deliveryDistrict: z.string().optional(),
  weightKg: z.number().optional(),
  dimensions: z.string().optional(),
  packageType: z.string().optional(),
  description: z.string().min(1),
  priority: z.enum(["standard"]).optional(),
  paymentMethod: z.enum(["cod"]).optional(),
  deliveryFee: z.number().optional(),
  codAmount: z.number().optional(),
  returnOrderRate: z.number().optional(),
  specialInstructions: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isDraft: z.boolean().optional(),
  assignedDriverId: z
    .string()
    .regex(/^[a-f0-9]{24}$/i, { message: "Invalid driver id format" })
    .optional(),
  assignedCourierId: z
    .string()
    .regex(/^[a-f0-9]{24}$/i, { message: "Invalid courier id format" })
    .optional(),
  serviceType: z.enum(["1", "5", "9"]).optional(),
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
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const client = url.searchParams.get("client");

  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  if (payment) query.paymentMethod = payment;
  // if tab is internal get all deliveries with assignedDriverId that is not equal to 68b4e8320937d8c4337027a6
  if (tab === "internal") {
    const driverUsers = await User.find({ role: "driver" })
      .select("_id")
      .lean();
    const driverUserIds = driverUsers
      .map((u: { _id: unknown }) => u._id)
      .filter(
        (id) =>
          id instanceof ObjectId && id.toString() !== "68b4e8320937d8c4337027a6"
      );

    console.log("driverUserIds ===>", driverUserIds);
    query.assignedDriverId = { $in: driverUserIds };
  }
  // if tab is cod get all deliveries with assignedDriverId that is equal to 68b4e8320937d8c4337027a6
  if (tab === "cod") {
    query.assignedDriverId = "68b4e8320937d8c4337027a6";
  }

  if (tab === "courier") {
    const courierUsers = await User.find({ role: "courier" })
      .select("_id")
      .lean();
    const courierUserIds = courierUsers
      .map((u: { _id: unknown }) => u._id)
      .filter(
        (id) =>
          id instanceof ObjectId && id.toString() !== "68b4e8320937d8c4337027a6"
      );
    if (courierUserIds.length > 0) {
      query.assignedDriverId = { $in: courierUserIds };
    } else {
      return NextResponse.json({ deliveries: [] });
    }
  }

  if (client) query.createdById = client;
  if (from && to) {
    query.createdAt = {
      $gte: new Date(from + "T00:00:00.000Z"),
      $lte: new Date(to + "T23:59:59.999Z"),
    };
  }
  // Scope to the requesting user unless admin
  if (auth.role !== "admin") query.createdById = auth.userId;

  const deliveries = await Delivery.find(query)
    .sort({ createdAt: -1 })
    .populate("assignedDriverId", "firstName lastName")
    .populate("assignedCourierId", "firstName lastName courierCompanyName")
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
    // fetch delivery fee and store name from user record
    const user = await User.findById(auth.userId)
      .select(
        "deliveryFee customerStoreName firstName phone address city district postalCode returnOrderRate"
      )
      .lean();

    const input = CreateDeliverySchema.parse({
      ...body,
      deliveryFee: user?.deliveryFee || 0,
      // Automatically populate customerStoreName from user account if not provided
      customerStoreName: body.customerStoreName || user?.customerStoreName,
      senderName: body.senderName || user?.firstName,
      senderPhone: body.senderPhone || user?.phone,
      senderAddress: body.senderAddress || user?.address,
      senderCity: body.senderCity || user?.city,
      senderDistrict: body.senderDistrict || user?.district,
      senderPostalCode: body.senderPostalCode || user?.postalCode,
      returnOrderRate: body.returnOrderRate || user?.returnOrderRate,
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

    // Add initial activity log entry
    const initialActivity = {
      action: "created",
      performedBy: auth.userId,
      performedAt: new Date(),
      details: "Delivery created",
    };

    const deliveryData = {
      ...input,
      createdById: auth.userId,
      activityLog: [initialActivity],
    };

    let doc;
    try {
      doc = await Delivery.create(deliveryData);
    } catch (error) {
      console.error("Error creating delivery:", error);
      throw error;
    }

    // Only forward to 3rd party COD solutions if not assigned to a courier and is assigned to special COD driver
    try {
      if (
        !input.assignedCourierId && // Not assigned to courier
        (!input.assignedDriverId ||
          input.assignedDriverId === "68b4e8320937d8c4337027a6") &&
        auth.role === "admin"
      ) {
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
            customer_email: "not-available@gmail.com",
            number: input.customerPhone,
            address: input.deliveryAddress,
            city: input.deliveryCity,
            amount: input.codAmount || 0,
            description: input.description,
            branded_content: "No",
            country: 2,
            whatsapp: input.customerWhatsApp,
            insurance: "No",
            client_id: 82589,
            location: input.deliveryDistrict,
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
            await Delivery.findByIdAndUpdate(doc._id, {
              $set: { thirdPartyShipmentNumber: j.shipment_number },
            });
          }
        }
      }
    } catch (e) {
      console.error("Create delivery error", e);
    }

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
