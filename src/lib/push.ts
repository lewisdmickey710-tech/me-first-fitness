import webpush, { WebPushError } from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:hello@mefirstfitness.app",
    vapidPublicKey,
    vapidPrivateKey
  );
}

export interface PushPayload {
  title: string;
  body: string;
  /** Where the service worker's notificationclick handler should send them. */
  url?: string;
}

// Pushes to every device a user has subscribed on, alongside whatever email
// already went out -- email stays the reliable record, this is just the
// faster nudge when it's available. Silently a no-op if VAPID isn't
// configured yet, or the user has no subscriptions.
export async function sendPushToUser(
  admin: SupabaseClient,
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          JSON.stringify(payload)
        );
      } catch (err) {
        // 404/410 means the push service considers this subscription gone
        // for good (uninstalled, permission revoked, endpoint expired) --
        // clean it up rather than retrying it forever. Anything else is
        // logged but doesn't fail whatever triggered the notification.
        if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("Push send failed", err);
        }
      }
    })
  );
}
