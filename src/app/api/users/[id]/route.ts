import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/session";

export const runtime = "nodejs";

/**
 *      firstName: firstName || undefined,
          lastName: lastName || undefined,
          phone: phone || undefined,
          role: role as "admin" | "driver" | "manager" | "customer",
          isActive,
          address: address || undefined,
          city: city || undefined,
          district: district || undefined,
          postalCode: postalCode || undefined,
          deliveryFee: deliveryFee,
          returnOrderRate: returnOrderRate,
        }),
 */

const UpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "driver", "manager", "customer"]).optional(),
  isActive: z.boolean().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  postalCode: z.string().optional(),
  deliveryFee: z.number().optional(),
  returnOrderRate: z.number().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(_req: NextRequest, { params }: any) {
  await connectToDatabase();
  const { id } = await params;
  const user = await User.findById(id)
    .select(
      "firstName lastName email role isActive phone createdAt deliveryFee returnOrderRate"
    )
    .lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: NextRequest, { params }: any) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth || (auth.role !== "admin" && auth.role !== "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const input = UpdateUserSchema.parse(body);
    const { id } = await params;
    const updated = await User.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true }
    )
      .select(
        "firstName lastName email role isActive phone createdAt deliveryFee returnOrderRate"
      )
      .lean();
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ user: updated });
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
export async function DELETE(req: NextRequest, { params }: any) {
  await connectToDatabase();
  const auth = await getAuthUser(req);
  if (!auth || (auth.role !== "admin" && auth.role !== "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await User.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
