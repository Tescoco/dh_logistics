import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth";
import { getAuthUser } from "@/lib/session";

const CreateCourierSchema = z.object({
  courierCompanyName: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.union([z.string().min(1), z.literal("")]).optional(),
  email: z.string().email(),
  phone: z.union([z.string().min(1), z.literal("")]).optional(),
  courierContactEmail: z.union([z.string().email(), z.literal("")]).optional(),
  courierContactPhone: z.union([z.string().min(1), z.literal("")]).optional(),
  courierServiceAreas: z.array(z.string()).optional(),
  address: z.union([z.string().min(1), z.literal("")]).optional(),
  city: z.union([z.string().min(1), z.literal("")]).optional(),
  district: z.union([z.string().min(1), z.literal("")]).optional(),
  postalCode: z.union([z.string().min(1), z.literal("")]).optional(),
});

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const authUser = await getAuthUser(req);
  if (!authUser || (authUser.role !== "admin" && authUser.role !== "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const couriers = await User.find({ role: "courier" })
    .select(
      "firstName lastName email phone courierCompanyName courierContactEmail courierContactPhone courierServiceAreas isActive createdAt"
    )
    .lean();
  return NextResponse.json({ couriers });
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const authUser = await getAuthUser(req);
  if (!authUser || (authUser.role !== "admin" && authUser.role !== "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const input = CreateCourierSchema.parse(body);

    const existing = await User.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    // Generate a default password for couriers
    const defaultPassword = `courier_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const passwordHash = await hashPassword(defaultPassword);

    const courier = await User.create({
      firstName: input.firstName,
      lastName: input.lastName || "",
      email: input.email.toLowerCase(),
      phone: input.phone || undefined,
      role: "courier",
      passwordHash,
      courierCompanyName: input.courierCompanyName,
      courierContactEmail: input.courierContactEmail || input.email,
      courierContactPhone:
        input.courierContactPhone || input.phone || undefined,
      courierServiceAreas: input.courierServiceAreas || [],
      address: input.address || undefined,
      city: input.city || undefined,
      district: input.district || undefined,
      postalCode: input.postalCode || undefined,
    });
    return NextResponse.json({ id: courier._id.toString() }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error("Create courier error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
