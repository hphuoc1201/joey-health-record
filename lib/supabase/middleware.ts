import { NextResponse, type NextRequest } from "next/server";

// Cheap redirect guard for direct page loads.
//
// This deliberately does NOT call supabase.auth.getUser(): that is a network
// round trip to Supabase, and middleware runs on every request — including the
// RSC requests and prefetches Next.js issues while navigating — which made
// every page transition take seconds.
//
// Only the presence of a Supabase session cookie is checked here, purely to
// decide where to send the browser. It is not an authorization check and does
// not need to be: Row Level Security in the database is what actually protects
// the data, and AuthProvider verifies the real session on the client.
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.startsWith("sb-") &&
        c.name.includes("auth-token") &&
        c.value.length > 0,
    );
}

export async function updateSession(request: NextRequest) {
  const signedIn = hasSessionCookie(request);
  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/verify");

  // Not logged in and trying to reach a protected page -> go to login.
  if (!signedIn && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Already logged in but on an auth page -> go home.
  if (signedIn && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
