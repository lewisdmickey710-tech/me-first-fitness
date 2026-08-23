"use server";

import { createAdminClient } from "@/lib/supabase/admin";
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

  // verifyOtp's own docs mark 'magiclink' as a deprecated verification
  // type -- 'email' is the current one for verifying an emailed OTP/link,
  // and it accepts the exact same hashed_token a 'magiclink' request
  // produces. Hardcoded here rather than using verification_type, which
  // would echo back the now-deprecated 'magiclink'.
  const actionLink = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?token_hash=${data.properties.hashed_token}&type=email&next=/`;
  await sendClientLoginLinkEmail(trimmed, actionLink);
}
