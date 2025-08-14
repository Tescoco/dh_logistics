import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth";
import { getAuthUser } from "@/lib/session";

const CreateUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["admin", "driver", "manager", "customer"]).default("driver"),
  password: z.string().min(8),
});

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const authUser = await getAuthUser(req);
  if (!authUser || (authUser.role !== "admin" && authUser.role !== "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await User.find()
    .select("firstName lastName email role isActive createdAt")
    .lean();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const authUser = await getAuthUser(req);
  if (!authUser || (authUser.role !== "admin" && authUser.role !== "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const input = CreateUserSchema.parse(body);

    const existing = await User.findOne({ email: input.email });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(input.password);
    const user = await User.create({
      firstName: input.firstName,
      lastName: input?.lastName || " ",
      email: input.email,
      phone: input.phone,
      role: input.role,
      passwordHash,
    });
    return NextResponse.json({ id: user._id.toString() }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error("Create user error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
