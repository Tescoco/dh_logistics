import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { verifyPassword, createJwt } from "@/lib/auth";

export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = LoginSchema.parse(body);

    await connectToDatabase();

    const user = await User.findOne({ email: input.email });
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createJwt({
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    // Call third-party login on the server (no form-data; query params only)
    let thirdParty: unknown = null;
    try {
      const url = new URL("https://codsolution.co/ship/Api/loginApi");
      url.searchParams.set("email", "zaidansari864@gmail.com");
      url.searchParams.set("password", "ZXCasd123@");
      const thirdRes = await fetch(url.toString(), { method: "POST" });
      thirdParty = await thirdRes.json().catch(() => null);
    } catch {}

    const res = NextResponse.json({
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      // expire in 1 day as requested
      maxAge: 60 * 60 * 24,
    });
    return res;
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error("Login error", err);
    const message =
      (err as { message?: string })?.message || "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
