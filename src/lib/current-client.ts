import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";

/** The `clients` row linked to the currently signed-in client user. */
export async function getMyClient(): Promise<Client | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (data as Client) ?? null;
}
