import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { Card, EmptyState, Heart } from "@/components/ui";
import { getMyClient } from "@/lib/current-client";
import { NotificationToggle } from "@/components/notification-toggle";
import { NotificationPreferences } from "@/components/notification-preferences";
import { ThemePicker } from "@/components/theme-picker";
import { makeT } from "@/lib/i18n";
import { isClientTheme } from "@/lib/theme";

export default async function ClientSettingsPage() {
  const me = await getMyClient();

  if (!me) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Something went wrong linking your account. Reach out and I'll get it sorted."
      />
    );
  }

  const t = makeT(me.language);

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        {t("Settings")}
      </h1>
      <p className="text-sm text-gray">
        {t("Notifications, how the app looks, and your data.")}{" "}
        <Link href="/client/profile" className="text-rose hover:underline">
          {t("Edit your info →")}
        </Link>
      </p>

      <Card className="space-y-2">
        <p className="font-medium text-ink">{t("Notifications")}</p>
        <p className="text-sm text-gray">
          {t("Get an instant alert on this device for session reminders and other updates — on top of, not instead of, email.")}
        </p>
        <NotificationToggle locale={me.language} />
      </Card>

      <Card className="space-y-2">
        <p className="font-medium text-ink">{t("What you get notified about")}</p>
        <p className="text-sm text-gray">
          {t("Turn any of these off if you don't want them -- session reminders and emergency messages are never optional.")}
        </p>
        <NotificationPreferences
          initial={{
            notify_announcements: me.notify_announcements,
            notify_streaks: me.notify_streaks,
            notify_tracking_reminders: me.notify_tracking_reminders,
          }}
          locale={me.language}
        />
      </Card>

      <Card className="space-y-2">
        <p className="font-medium text-ink">{t("Color scheme")}</p>
        <p className="text-sm text-gray">
          {t("Pick the accent color you see throughout the app -- just for your own view.")}
        </p>
        <ThemePicker
          current={isClientTheme(me.theme) ? me.theme : "rose"}
          locale={me.language}
        />
      </Card>

      <Card className="space-y-2">
        <p className="font-medium text-ink">{t("Your data")}</p>
        <p className="text-sm text-gray">
          {t("Download everything tracked here for you — sessions, check-ins, measurements, documents you've signed, all of it — for your own records any time, including if you ever stop training with Mickey.")}
        </p>
        <a
          href="/api/client/export"
          className="inline-block rounded-xl border border-grayLt bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-bg"
        >
          {t("Download my data")}
        </a>
      </Card>
    </div>
  );
}
