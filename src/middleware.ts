import { NextResponse, type NextRequest } from "next/server";
import { verifyJwt, type JwtPayload } from "@/lib/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin")) {
    // Allow the public login route without auth
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      const url = new URL("/admin/login", req.url);
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    try {
      const payload = await verifyJwt<JwtPayload>(token);
      const role = payload.role;
      if (role !== "admin" && role !== "manager") {
        const url = new URL("/", req.url);
        return NextResponse.redirect(url);
      }
    } catch {
      const url = new URL("/admin/login", req.url);
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
