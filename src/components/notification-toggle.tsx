"use client";

import { useEffect, useState } from "react";
import { subscribeToPush, unsubscribeFromPush } from "@/app/actions/push";
import { Button } from "@/components/ui";
import { makeT, type Locale } from "@/lib/i18n";

type Status = "loading" | "unsupported" | "denied" | "subscribed" | "off";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// A deliberate button, never an auto-prompt on load -- browsers require an
// actual click before asking for notification permission, and asking
// unprompted is how people reflexively hit "block" and can't be re-asked.
export function NotificationToggle({ locale }: { locale?: Locale }) {
  const t = makeT(locale);
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setStatus(sub ? "subscribed" : "off");
      } catch {
        if (!cancelled) setStatus("off");
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function turnOn() {
    setError(null);
    setBusy(true);
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Notifications aren't set up yet.");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        setBusy(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // The DOM lib's BufferSource type doesn't accept a Uint8Array typed
        // over the broader ArrayBufferLike (which includes SharedArrayBuffer)
        // -- this one is always backed by a plain ArrayBuffer, so the cast
        // is safe.
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await subscribeToPush(
        { endpoint: json.endpoint, keys: json.keys },
        navigator.userAgent
      );
      setStatus("subscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Couldn't turn on notifications."));
    }
    setBusy(false);
  }

  async function turnOff() {
    setError(null);
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeFromPush(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Couldn't turn off notifications."));
    }
    setBusy(false);
  }

  if (status === "loading") return null;

  if (status === "unsupported") {
    return (
      <p className="text-sm text-gray">
        {t("Notifications aren't supported on this browser/device.")}
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="text-sm text-gray">
        {t("Notifications are blocked for this site -- check your browser or device settings to turn them back on.")}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {status === "subscribed" ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink">{t("🔔 Notifications on")}</span>
          <Button type="button" variant="secondary" disabled={busy} onClick={turnOff}>
            {t("Turn off")}
          </Button>
        </div>
      ) : (
        <Button type="button" disabled={busy} onClick={turnOn}>
          {t("Turn on notifications")}
        </Button>
      )}
      {error ? <p className="text-sm text-pink">{error}</p> : null}
    </div>
  );
}
