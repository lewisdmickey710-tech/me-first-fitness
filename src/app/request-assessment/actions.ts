"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

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
    throw new Error("Name, email, and a preferred date are required.");
  }

  const supabase = createAdminClient();

  const { data: inviteData, error: inviteError } =
    await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    });

  let userId: string;
  if (inviteError) {
    // Most likely: this email already has an account. Look it up instead
    // of failing the whole submission.
    const { data: existing } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    const match = existing?.users.find(
      (u) => u.email?.toLowerCase() === email
    );
    if (!match) throw new Error(inviteError.message);
    userId = match.id;
  } else {
    userId = inviteData.user.id;
  }

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

  redirect("/request-assessment/sent");
}
