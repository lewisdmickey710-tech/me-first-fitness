"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import type { AnnouncementCategory } from "@/lib/types";

export async function sendAnnouncement(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "announcement");
  const category: AnnouncementCategory = categoryRaw === "emergency" ? "emergency" : "announcement";

  if (!title) throw new Error("Title is required.");
  if (!body) throw new Error("Message is required.");

  const supabase = await createClient();
  const admin = createAdminClient();

  // Real, currently-active clients with a login -- a lead or an archived
  // or test client was never meant to receive a broadcast.
  let query = supabase
    .from("clients")
    .select("user_id, notify_announcements")
    .not("user_id", "is", null)
    .eq("is_test", false)
    .is("archived_at", null);
  // Emergency bypasses the opt-out entirely -- everything else respects
  // it, which the query itself enforces rather than filtering after the
  // fact, so there's no chance of a logic slip letting an unwanted push
  // through.
  if (category !== "emergency") {
    query = query.eq("notify_announcements", true);
  }
  const { data: recipients, error } = await query;
  if (error) throw new Error(error.message);

  let sent = 0;
  await Promise.all(
    (recipients ?? []).map(async (c) => {
      if (!c.user_id) return;
      try {
        await sendPushToUser(admin, c.user_id, {
          title: category === "emergency" ? `🚨 ${title}` : title,
          body,
          url: "/client/dashboard",
        });
        sent++;
      } catch (err) {
        console.error("Failed to send announcement push", err);
      }
    })
  );

  const { error: logError } = await supabase.from("coach_announcements").insert({
    title,
    body,
    category,
    recipient_count: sent,
  });
  if (logError) throw new Error(logError.message);

  revalidatePath("/coach/announce");
}
