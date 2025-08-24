import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth";
import { getAuthUser } from "@/lib/session";

const CreateCourierSchema = z.object({
  courierCompanyName: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  courierContactEmail: z.string().email().optional(),
  courierContactPhone: z.string().optional(),
  courierServiceAreas: z.array(z.string()).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  postalCode: z.string().optional(),
  password: z.string().min(8),
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

    const existing = await User.findOne({ email: input.email });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(input.password);
    const courier = await User.create({
      firstName: input.firstName,
      lastName: input.lastName || "",
      email: input.email,
      phone: input.phone,
      role: "courier",
      passwordHash,
      courierCompanyName: input.courierCompanyName,
      courierContactEmail: input.courierContactEmail || input.email,
      courierContactPhone: input.courierContactPhone || input.phone,
      courierServiceAreas: input.courierServiceAreas || [],
      address: input.address,
      city: input.city,
      district: input.district,
      postalCode: input.postalCode,
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
