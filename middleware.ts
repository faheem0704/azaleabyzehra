import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

// Use the Edge-safe auth config (no Prisma/pg — JWT-only)
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Protect admin routes — /admin/login is excluded via matcher below
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    if ((session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect user-only routes
  if (
    pathname.startsWith("/orders") ||
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/account")
  ) {
    if (!session) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  // Exclude /admin/login from the middleware so the login page is never intercepted
  matcher: ["/admin/((?!login).*)", "/orders/:path*", "/wishlist/:path*", "/checkout/:path*", "/checkout", "/account/:path*"],
};
