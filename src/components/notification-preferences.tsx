"use client";

import { useState, useTransition } from "react";
import { updateNotificationPreference } from "@/app/client/actions";
import { makeT, type Locale } from "@/lib/i18n";

const PREFERENCES = [
  { column: "notify_announcements", label: "Announcements from Mickey" },
  { column: "notify_streaks", label: "Streak celebrations" },
  { column: "notify_tracking_reminders", label: "Reminders to track" },
] as const;

export function NotificationPreferences({
  initial,
  locale,
}: {
  initial: { notify_announcements: boolean; notify_streaks: boolean; notify_tracking_reminders: boolean };
  locale?: Locale;
}) {
  const t = makeT(locale);
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle(column: (typeof PREFERENCES)[number]["column"]) {
    const next = !values[column];
    setValues((v) => ({ ...v, [column]: next }));
    startTransition(async () => {
      await updateNotificationPreference(column, next);
    });
  }

  return (
    <div className="space-y-2">
      {PREFERENCES.map((p) => (
        <label key={p.column} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-ink">{t(p.label)}</span>
          <input
            type="checkbox"
            checked={values[p.column]}
            disabled={pending}
            onChange={() => toggle(p.column)}
            className="h-4 w-4 accent-rose"
          />
        </label>
      ))}
      <div className="flex items-center justify-between gap-3 text-sm opacity-60">
        <span className="text-ink">{t("Session reminders")}</span>
        <span className="text-xs text-gray">{t("Always on")}</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm opacity-60">
        <span className="text-ink">{t("Emergency messages from Mickey")}</span>
        <span className="text-xs text-gray">{t("Always on")}</span>
      </div>
    </div>
  );
}
