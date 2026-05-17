import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/login", "/register", "/api/auth", "/favicon.ico"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isPublic = PUBLIC_PATHS.some(
    (p) => nextUrl.pathname === p || nextUrl.pathname.startsWith(p + "/")
  );

  // Allow static and uploads
  if (
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.startsWith("/uploads") ||
    nextUrl.pathname.startsWith("/images") ||
    /\.(svg|png|jpg|jpeg|webp|ico|css|js|map)$/.test(nextUrl.pathname)
  ) {
    return NextResponse.next();
  }

  if (!session && !isPublic) {
    const url = new URL("/login", nextUrl.origin);
    url.searchParams.set("from", nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (session && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
