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
  specialInstructions: z.array(z.string()).optional(),
  notes: z.string().optional(),
  status: z
    .enum(["pending", "assigned", "in_transit", "delivered", "returned"])
    .optional(),
});

type RouteParams = { params: { id: string } };

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
    const updated = await Delivery.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true }
    ).lean();
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
