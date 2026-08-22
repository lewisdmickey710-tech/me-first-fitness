import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Supabase redirects here with ?error=... instead of ?code=... when the
  // link itself was already invalid (expired, already used, malformed) --
  // most commonly because an email client's link-scanner/prefetcher opened
  // the one-time link before the person actually tapped it.
  const upstreamError = searchParams.get("error_description") ?? searchParams.get("error");
  if (upstreamError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(upstreamError)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("No login code found in that link. Try requesting a new one.")}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}/`);
}
