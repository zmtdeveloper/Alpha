import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const fallbackNextPath = "/onboarding";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const nextPath = getSafeNextPath(
    requestUrl.searchParams.get("next"),
    requestUrl,
  );
  const redirectTo = new URL(nextPath, requestUrl);
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  return NextResponse.redirect(
    new URL("/login?auth_error=invalid-link", requestUrl),
  );
}

function getSafeNextPath(value: string | null, requestUrl: URL) {
  if (!value) {
    return fallbackNextPath;
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  try {
    const parsed = new URL(value);

    if (parsed.origin !== requestUrl.origin) {
      return fallbackNextPath;
    }

    if (parsed.pathname === "/auth/confirm") {
      return getSafeNextPath(parsed.searchParams.get("next"), requestUrl);
    }

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallbackNextPath;
  }
}
