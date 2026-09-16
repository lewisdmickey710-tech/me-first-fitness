import type { SupabaseClient } from "@supabase/supabase-js";

// The one coach account's own email -- there's exactly one, so it's just
// whoever holds the "coach" profile role, looked up via an admin client
// the same way a client's login email is resolved elsewhere in this app.
// Callers must pass an ADMIN client (service role) -- auth.admin.getUserById
// isn't available to a normal request-scoped client.
export async function getCoachEmail(admin: SupabaseClient): Promise<string | null> {
  const { data: coachProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "coach")
    .maybeSingle();
  if (!coachProfile) return null;
  const { data } = await admin.auth.admin.getUserById(coachProfile.id);
  return data?.user?.email ?? null;
}
