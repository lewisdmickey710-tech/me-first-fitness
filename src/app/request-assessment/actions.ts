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
    // Supabase's own action_link format is `type={verification_type}` --
    // the hashed_token is only valid for verification against the exact
    // type it was generated with ('magiclink' here), so that has to be
    // echoed back verbatim rather than substituted for anything else.
    const actionLink = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=${linkData.properties.verification_type}&next=/`;
    await sendLeadInviteEmail(email, name, actionLink);

    // The on-signup DB trigger always creates a profiles row defaulting
    // to role 'client' before this ever runs (it fires the instant
    // generateLink creates the auth.users row), so a brand-new lead's
    // profile is never actually missing here -- checking for that never
    // promoted anyone to 'lead'. Promote instead unless this email
    // belongs to the coach or an already-linked client (never downgrade
    // a real account that happens to reuse this email) or is already a
    // lead.
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (existingProfile?.role !== "coach" && existingProfile?.role !== "lead") {
      const { data: linkedClient } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!linkedClient) {
        const { error: profileError } = existingProfile
          ? await supabase.from("profiles").update({ role: "lead" }).eq("id", userId)
          : await supabase.from("profiles").insert({ id: userId, role: "lead" });
        if (profileError) throw new Error(profileError.message);
      }
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
