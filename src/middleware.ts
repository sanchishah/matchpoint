import { NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth.edge";

const protectedPaths = ["/dashboard", "/games", "/book", "/profile", "/admin", "/club-admin"];
const authPaths = ["/login", "/signup"];

export default authMiddleware((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as { role?: string } | undefined)?.role;

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && authPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect routes — redirect unauthenticated users to login
  if (!isLoggedIn && protectedPaths.some((p) => pathname.startsWith(p))) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin check — redirect non-admin users away from /admin
  if (isLoggedIn && pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/games/:path*",
    "/book/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/club-admin/:path*",
    "/login",
    "/signup",
  ],
};
