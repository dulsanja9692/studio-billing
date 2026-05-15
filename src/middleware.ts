import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  // If user is NOT logged in and trying to access a protected page → send to login
  if (!session && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user IS logged in and trying to access /login → send to dashboard
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Protect all routes except static files, api routes, and Next.js internals
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.jpg|.*\\.svg$).*)"],
};
