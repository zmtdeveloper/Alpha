import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import type { Database } from "@/lib/database.types";
import { getSupabaseKey, getSupabaseUrl } from "@/lib/supabase/config";

const publicPaths = new Set(["/", "/login", "/pricing", "/signup"]);
const reservedRootSegments = new Set([
  "",
  "api",
  "invite",
  "login",
  "onboarding",
  "pricing",
  "signup",
]);

function isInvitePath(pathname: string) {
  return pathname === "/invite" || pathname.startsWith("/invite/");
}

function isProtectedPath(pathname: string) {
  if (pathname === "/onboarding") {
    return true;
  }

  if (publicPaths.has(pathname) || isInvitePath(pathname)) {
    return false;
  }

  const firstSegment = pathname.split("/")[1] ?? "";

  return !reservedRootSegments.has(firstSegment);
}

function redirectTo(pathname: string, request: NextRequest) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, options, value }) => {
            response.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(data.user) && !error;
  const pathname = request.nextUrl.pathname;

  if (!isAuthenticated && isProtectedPath(pathname)) {
    await supabase.auth.signOut();

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && (pathname === "/" || pathname === "/login")) {
    return redirectTo("/onboarding", request);
  }

  if (isAuthenticated && pathname === "/signup") {
    return redirectTo("/onboarding", request);
  }

  return response;
}
