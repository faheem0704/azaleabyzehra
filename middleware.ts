import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

// Use the Edge-safe auth config (no Prisma/pg — JWT-only)
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Protect admin routes (but not the login page itself)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    if ((session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect user-only routes
  if (pathname.startsWith("/orders") || pathname.startsWith("/wishlist")) {
    if (!session) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/orders/:path*", "/wishlist/:path*"],
};
