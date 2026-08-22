import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types";

/** The `leads` row linked to the currently signed-in lead user. */
export async function getMyLead(): Promise<Lead | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (data as Lead) ?? null;
}
