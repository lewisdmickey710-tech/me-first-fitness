import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

// Verifies a magic-link email purely server-side against Supabase's stored
// OTP record (token_hash), unlike /auth/callback's code exchange -- which
// needs a secret stashed in the browser that originally requested the
// link. That breaks whenever the link is opened somewhere else (Yahoo/
// Outlook/Gmail's own in-app browser instead of the client's regular
// browser), which is the normal case on a phone, not an edge case. This
// route has no such requirement -- it works from any device or app, as
// long as the link hasn't already been used or expired.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error(`verifyOtp failed (type=${type}):`, error.status, error.code, error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("No login code found in that link. Try requesting a new one.")}`
  );
}
