"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendClientLoginLinkEmail } from "@/lib/email";

export async function sendClientLoginLink(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) throw new Error("Enter your email.");

  const supabase = createAdminClient();

  // generateLink creates the user if this is their first time (same as
  // the old signInWithOtp default) or just generates a login link if they
  // already have an account -- either way, it never sends an email
  // itself, so it never touches Supabase Auth's own email sender.
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: trimmed,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  });
  if (error) throw new Error(error.message);

  // Supabase's own action_link format is `type={verification_type}` --
  // the hashed_token is only valid for verification against the exact
  // type it was generated with ('magiclink' here), so that has to be
  // echoed back verbatim rather than substituted for anything else.
  const actionLink = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?token_hash=${data.properties.hashed_token}&type=${data.properties.verification_type}&next=/`;
  // generateLink hands back a plain 6-digit code alongside the link
  // (data.properties.email_otp) -- same underlying OTP record, just a
  // second way to redeem it. Verifying by typed code (verifyClientLoginCode
  // below) never leaves whatever app/browser it's typed into, unlike the
  // link, which always opens in Safari first even with the Home Screen
  // icon installed -- so it's the one path that works entirely from
  // inside an already-installed PWA.
  await sendClientLoginLinkEmail(trimmed, actionLink, data.properties.email_otp);
}

export async function verifyClientLoginCode(email: string, code: string) {
  const trimmed = email.trim().toLowerCase();
  const trimmedCode = code.trim();
  if (!trimmed || !trimmedCode) throw new Error("Enter your email and the code.");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: trimmed,
    token: trimmedCode,
    type: "email",
  });
  if (error) throw new Error(error.message);
}
