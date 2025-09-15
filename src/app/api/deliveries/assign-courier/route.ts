import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Delivery } from "@/models/Delivery";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/session";
import { ObjectId } from "mongodb";

const AssignCourierSchema = z.object({
  deliveryIds: z.array(z.string().regex(/^[a-f0-9]{24}$/i)),
  courierId: z.string().regex(/^[a-f0-9]{24}$/i),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { deliveryIds, courierId } = AssignCourierSchema.parse(body);

    // Verify courier exists and is active
    const courier = await User.findById(courierId)
      .select("_id role isActive courierCompanyName firstName lastName phone")
      .lean();

    if (!courier) {
      return NextResponse.json({ error: "Courier not found" }, { status: 400 });
    }

    if (!courier.isActive) {
      return NextResponse.json(
        { error: "Courier is not active" },
        { status: 400 }
      );
    }

    for (const deliveryId of deliveryIds) {
      const delivery = await Delivery.findById(deliveryId).lean();
      if (!delivery) {
        return NextResponse.json(
          { error: "Delivery not found" },
          { status: 400 }
        );
      }

      if (
        courierId === "68c8103f91e0438730fbfc28" &&
        (delivery.assignedDriverId?.toString() !== courierId ||
          delivery.status === "pending") &&
        authUser.role === "admin"
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
              name: delivery.customerName,
              reference: delivery.reference,
              customer_email: "not-available@gmail.com",
              number: delivery.customerPhone,
              address: delivery.deliveryAddress,
              city: delivery.deliveryCity,
              amount: delivery.codAmount || 0,
              description: delivery.description,
              branded_content: "No",
              country: 2,
              whatsapp: delivery.customerWhatsApp,
              insurance: "No",
              client_id: 82589,
              location: delivery.deliveryDistrict,
              Service:
                delivery.serviceType === "1"
                  ? 1
                  : delivery.serviceType === "5"
                  ? 5
                  : 9,
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
              await Delivery.findByIdAndUpdate(deliveryId, {
                $set: { thirdPartyShipmentNumber: j.shipment_number },
              });

              delivery.activityLog?.push({
                action: "cod_logistics_order_created",
                performedBy: authUser.userId as unknown as ObjectId,
                performedAt: new Date(),
                details: `Order created on COD logistics with shipment number: ${j.shipment_number}`,
                newValue: j.shipment_number,
              });
            } else {
              // Add activity log for failed COD logistics order creation
              delivery.activityLog?.push({
                action: "cod_logistics_order_failed",
                performedBy: authUser.userId as unknown as ObjectId,
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
          delivery.activityLog?.push({
            action: "cod_logistics_api_error",
            performedBy: authUser.userId as unknown as ObjectId,
            performedAt: new Date(),
            details: `Error calling COD logistics API: ${
              e instanceof Error ? e.message : "Unknown error"
            }`,
          });
        }
      }
    }
    // Update deliveries
    const updateResult = await Delivery.updateMany(
      { _id: { $in: deliveryIds } },
      {
        $set: {
          assignedDriverId: courierId,
          status: "assigned",
        },
        $push: {
          activityLog: {
            action: `assigned_to_${courier.role}`,
            performedBy: authUser.userId,
            performedAt: new Date(),
            details: `Assigned to ${courier.role}: ${
              courier.courierCompanyName || courier.firstName
            } ${courier.lastName}`,
          },
        },
      }
    );

    console.log(updateResult);

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "No deliveries found to update" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedCount: updateResult.modifiedCount,
      courierName: courier.courierCompanyName || courier.firstName,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error("Assign courier error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
