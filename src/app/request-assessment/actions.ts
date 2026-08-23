"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLeadInviteEmail } from "@/lib/email";

export async function submitAssessmentRequest(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const preferredDate = String(formData.get("preferred_date") ?? "");
  const preferredTime = String(formData.get("preferred_time") ?? "");

  if (!name || !email || !preferredDate) {
    redirect(
      `/request-assessment?error=${encodeURIComponent("Name, email, and a preferred date are required.")}`
    );
  }

  // Anything below can fail on us (email sending, a transient DB hiccup) --
  // this is a public-facing form, so a visitor should always land back on
  // a friendly message, never a raw crash page.
  try {
    const supabase = createAdminClient();

    // generateLink creates the user if they don't exist yet (same as
    // inviteUserByEmail) or just generates a login link if they do (same
    // as signInWithOtp) -- one path handles both cases. Crucially, it
    // never sends an email itself, so it never touches Supabase Auth's
    // own email sender (the thing that was actually failing) -- the link
    // is delivered through our own Resend pipeline instead.
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
        },
      });
    if (linkError) throw new Error(linkError.message);

    const userId = linkData.user.id;
    // verifyOtp's own docs mark 'magiclink' as a deprecated verification
    // type -- 'email' is the current one for verifying an emailed OTP/link,
    // and it accepts the exact same hashed_token a 'magiclink' request
    // produces. Hardcoded here rather than using verification_type, which
    // would echo back the now-deprecated 'magiclink'.
    const actionLink = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=email&next=/`;
    await sendLeadInviteEmail(email, name, actionLink);

    // Only set role to 'lead' for a brand-new profile -- never downgrade an
    // existing coach/client account that happens to reuse this email.
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: userId, role: "lead" });
      if (profileError) throw new Error(profileError.message);
    }

    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    let leadId: string;
    if (existingLead) {
      leadId = existingLead.id;
    } else {
      const { data: newLead, error: leadError } = await supabase
        .from("leads")
        .insert({
          user_id: userId,
          name,
          email,
          phone: phone || null,
          note: note || null,
        })
        .select("id")
        .single();
      if (leadError) throw new Error(leadError.message);
      leadId = newLead.id;
    }

    const { error: requestError } = await supabase
      .from("lead_assessment_requests")
      .insert({
        lead_id: leadId,
        preferred_date: preferredDate,
        preferred_time: preferredTime || null,
        note: note || null,
      });
    if (requestError) throw new Error(requestError.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    redirect(`/request-assessment?error=${encodeURIComponent(message)}`);
  }

  redirect("/request-assessment/sent");
}
