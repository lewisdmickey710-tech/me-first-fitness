import { Fragment } from "react";
import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { addHabit, cycleHabitLog, deleteHabit } from "@/app/client/actions";
import { Button, Card, EmptyState, Heart, Input } from "@/components/ui";
import { nowInBusinessTz, toDateString, weekDates } from "@/lib/timezone";
import { makeT } from "@/lib/i18n";
import type { ClientHabit, ClientHabitLog } from "@/lib/types";

const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

const LEVEL_CLASS: Record<number, string> = {
  1: "border-teal bg-teal",
  2: "border-gold bg-gold",
  3: "border-pink bg-pink",
};

export default async function ClientHabitsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const me = await getMyClient();

  if (!me) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Your coach hasn't linked your login to a client profile yet. Check back soon, or reach out."
      />
    );
  }

  const t = makeT(me.language);
  const { week: weekParam } = await searchParams;
  const weekOffset = Math.min(0, Math.trunc(Number(weekParam ?? 0)) || 0);

  const supabase = await createClient();
  const now = nowInBusinessTz();
  const todayStr = toDateString(now);
  const last7Days = weekDates(now, weekOffset);

  const [{ data: habits }, { data: habitLogs }] = await Promise.all([
    supabase
      .from("client_habits")
      .select("*")
      .eq("client_id", me.id)
      .eq("active", true)
      .order("created_at") as unknown as Promise<{ data: ClientHabit[] | null }>,
    supabase
      .from("client_habit_logs")
      .select("*")
      .eq("client_id", me.id)
      .gte("log_date", last7Days[0])
      .lte("log_date", last7Days[6]) as unknown as Promise<{
      data: ClientHabitLog[] | null;
    }>,
  ]);

  const levelByHabitAndDate = new Map(
    (habitLogs ?? []).map((l) => [`${l.habit_id}:${l.log_date}`, l.level])
  );

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          {t("Habits")}
        </h1>
        <p className="mt-1 text-sm text-gray">
          {t("Tap a day to cycle it through a level —")}{" "}
          <span className="font-medium text-teal">{t("teal")}</span> →{" "}
          <span className="font-medium text-gold">{t("gold")}</span> →{" "}
          <span className="font-medium text-pink">{t("pink")}</span> {t("→ clear. Use it however makes sense to you — done/not done, or how mild to severe something was.")}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/client/habits?week=${weekOffset - 1}`}
          className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink"
        >
          {t("← Prev week")}
        </Link>
        <p className="text-xs text-gray">
          {last7Days[0]} – {last7Days[6]}
        </p>
        {weekOffset < 0 ? (
          <Link
            href={`/client/habits?week=${weekOffset + 1}`}
            className="rounded-lg px-2 py-1 text-sm text-gray hover:text-ink"
          >
            {t("Next week →")}
          </Link>
        ) : (
          <span className="px-2 py-1 text-sm text-grayLt">{t("Next week →")}</span>
        )}
      </div>

      {(habits ?? []).length === 0 ? (
        <EmptyState
          title={t("No habits yet")}
          body={t("Add something you want to build consistency on — a stretch, a med, a walk, anything.")}
        />
      ) : (
        <Card className="space-y-3">
          <div className="grid grid-cols-[1fr_repeat(7,1.75rem)] items-center gap-x-1 gap-y-2 text-xs text-gray">
            <div />
            {last7Days.map((d) => {
              const dow = new Date(`${d}T00:00:00Z`).getUTCDay();
              return (
                <div
                  key={d}
                  className={`text-center ${d === todayStr ? "font-semibold text-rose" : ""}`}
                >
                  {WEEKDAY_SHORT[dow]}
                </div>
              );
            })}
            {(habits ?? []).map((habit) => (
              <Fragment key={habit.id}>
                <div className="flex items-center justify-between gap-2 pr-1">
                  <span className="truncate text-sm text-ink">{habit.name}</span>
                  <form
                    action={async () => {
                      "use server";
                      await deleteHabit(habit.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="shrink-0 text-xs text-gray hover:text-pink"
                      aria-label={t("Delete {name}", { name: habit.name })}
                    >
                      ✕
                    </button>
                  </form>
                </div>
                {last7Days.map((d) => {
                  const level = levelByHabitAndDate.get(`${habit.id}:${d}`);
                  return (
                    <form
                      key={`${habit.id}-${d}`}
                      action={async () => {
                        "use server";
                        await cycleHabitLog(habit.id, d);
                      }}
                      className="flex justify-center"
                    >
                      <button
                        type="submit"
                        className={`h-6 w-6 rounded-full border transition ${
                          level
                            ? LEVEL_CLASS[level]
                            : "border-grayLt bg-white hover:border-rose/40"
                        }`}
                        aria-label={
                          level
                            ? t("Level {n} — tap to change", { n: level })
                            : t("Tap to log")
                        }
                      />
                    </form>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <form
          action={async (formData: FormData) => {
            "use server";
            await addHabit(String(formData.get("name") ?? ""));
          }}
          className="flex gap-2"
        >
          <Input name="name" placeholder={t("New habit (e.g. stretch before bed)")} />
          <Button type="submit" variant="secondary">
            {t("Add")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
