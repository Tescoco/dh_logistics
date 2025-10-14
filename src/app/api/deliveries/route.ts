import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/session";
import { ObjectId } from "mongodb";
import ExcelJS from "exceljs";

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
  // if tab is internal get all deliveries with assignedDriverId that is not equal to 68c8103f91e0438730fbfc28
  if (tab === "internal") {
    const driverUsers = await User.find({ role: "driver" })
      .select("_id")
      .lean();
    const driverUserIds = driverUsers
      .map((u: { _id: unknown }) => u._id)
      .filter(
        (id) =>
          id instanceof ObjectId && id.toString() !== "68c8103f91e0438730fbfc28"
      );

    console.log("driverUserIds ===>", driverUserIds);
    query.assignedDriverId = { $in: driverUserIds };
  }
  // if tab is cod get all deliveries with assignedDriverId that is equal to 68c8103f91e0438730fbfc28
  if (tab === "cod") {
    query.assignedDriverId = "68c8103f91e0438730fbfc28";
  }

  if (tab === "courier") {
    const courierUsers = await User.find({ role: "courier" })
      .select("_id")
      .lean();
    const courierUserIds = courierUsers
      .map((u: { _id: unknown }) => u._id)
      .filter(
        (id) =>
          id instanceof ObjectId && id.toString() !== "68c8103f91e0438730fbfc28"
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

    // Handle download requests
    if (body.format && (body.format === "csv" || body.format === "xls")) {
      const { format, status, search } = body;

      // Build query
      const query: Record<string, unknown> = {};
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { reference: { $regex: search, $options: "i" } },
          { customerName: { $regex: search, $options: "i" } },
          { deliveryAddress: { $regex: search, $options: "i" } },
        ];
      }

      // Fetch deliveries with populated fields
      const deliveries = await Delivery.find(query)
        .populate("assignedDriverId", "firstName lastName")
        .populate("assignedCourierId", "firstName lastName courierCompanyName")
        .populate("createdById", "firstName lastName")
        .sort({ createdAt: -1 })
        .lean();

      // Format data for export
      const processedDeliveries = deliveries.map((delivery) => ({
        id: delivery._id.toString(),
        reference: delivery.reference,
        customerName: delivery.customerName,
        customerPhone: delivery.customerPhone,
        deliveryAddress: delivery.deliveryAddress,
        status: delivery.status,
        paymentMethod: delivery.paymentMethod,
        codAmount: delivery.codAmount || 0,
        deliveryFee: delivery.deliveryFee || 0,
        priority: delivery.priority,
        assignedDriver: delivery.assignedDriverId
          ? `${
              (
                delivery.assignedDriverId as {
                  firstName?: string;
                  lastName?: string;
                }
              )?.firstName || ""
            } ${
              (
                delivery.assignedDriverId as {
                  firstName?: string;
                  lastName?: string;
                }
              )?.lastName || ""
            }`.trim()
          : "",
        assignedCourier: delivery.assignedCourierId
          ? `${
              (
                delivery.assignedCourierId as {
                  firstName?: string;
                  lastName?: string;
                }
              )?.firstName || ""
            } ${
              (
                delivery.assignedCourierId as {
                  firstName?: string;
                  lastName?: string;
                }
              )?.lastName || ""
            }`.trim()
          : "",
        createdBy: delivery.createdById
          ? `${
              (
                delivery.createdById as {
                  firstName?: string;
                  lastName?: string;
                }
              )?.firstName || ""
            } ${
              (
                delivery.createdById as {
                  firstName?: string;
                  lastName?: string;
                }
              )?.lastName || ""
            }`.trim()
          : "",
        notes: delivery.notes || "",
        createdAt: new Date(delivery.createdAt).toLocaleString(),
        updatedAt: new Date(delivery.updatedAt).toLocaleString(),
      }));

      if (format === "csv") {
        // Generate CSV
        const csvHeaders = [
          "Reference",
          "Customer",
          "Phone",
          "Address",
          "Status",
          "Payment Method",
          "COD Amount",
          "Delivery Fee",
          "Priority",
          "Assigned Driver",
          "Assigned Courier",
          "Created By",
          "Notes",
          "Created At",
          "Updated At",
        ];

        const csvRows = processedDeliveries.map((delivery) => [
          delivery.reference,
          delivery.customerName,
          delivery.customerPhone,
          delivery.deliveryAddress,
          delivery.status,
          delivery.paymentMethod,
          delivery.codAmount.toString(),
          delivery.deliveryFee.toString(),
          delivery.priority,
          delivery.assignedDriver,
          delivery.assignedCourier,
          delivery.createdBy,
          delivery.notes,
          delivery.createdAt,
          delivery.updatedAt,
        ]);

        const csvContent = [
          csvHeaders.join(","),
          ...csvRows.map((row) =>
            row
              .map((field) => `"${String(field).replace(/"/g, '""')}"`)
              .join(",")
          ),
        ].join("\n");

        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="all-deliveries-${
              new Date().toISOString().split("T")[0]
            }.csv"`,
          },
        });
      } else if (format === "xls") {
        // Generate Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("All Deliveries");

        worksheet.columns = [
          { header: "Reference", key: "reference", width: 15 },
          { header: "Customer", key: "customerName", width: 20 },
          { header: "Phone", key: "customerPhone", width: 15 },
          { header: "Address", key: "deliveryAddress", width: 30 },
          { header: "Status", key: "status", width: 15 },
          { header: "Payment Method", key: "paymentMethod", width: 15 },
          { header: "COD Amount", key: "codAmount", width: 15 },
          { header: "Delivery Fee", key: "deliveryFee", width: 15 },
          { header: "Priority", key: "priority", width: 10 },
          { header: "Assigned Driver", key: "assignedDriver", width: 20 },
          { header: "Assigned Courier", key: "assignedCourier", width: 20 },
          { header: "Created By", key: "createdBy", width: 20 },
          { header: "Notes", key: "notes", width: 30 },
          { header: "Created At", key: "createdAt", width: 20 },
          { header: "Updated At", key: "updatedAt", width: 20 },
        ];

        processedDeliveries.forEach((delivery) => {
          worksheet.addRow(delivery);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return new NextResponse(buffer, {
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="all-deliveries-${
              new Date().toISOString().split("T")[0]
            }.xlsx"`,
          },
        });
      }
    }
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
      performedBy: new ObjectId(auth.userId),
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
          input.assignedDriverId === "68c8103f91e0438730fbfc28") &&
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
            whatsapp: input.customerWhatsApp ?? "-",
            insurance: "No",
            client_id: 82589,
            location: null,
            service:
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
