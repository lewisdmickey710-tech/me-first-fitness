"use server";

import { createClient } from "@/lib/supabase/server";

// Shared by both the coach and any client -- who's subscribing is just
// whoever's signed in (auth.uid()), so this doesn't belong under either
// role's own actions file.

export async function subscribeToPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      user_agent: userAgent,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw new Error(error.message);
}

export async function unsubscribeFromPush(endpoint: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
}
