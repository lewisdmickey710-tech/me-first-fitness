"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProgramDayFromLoggedWorkout } from "@/app/coach/actions";
import { Button, Select } from "@/components/ui";

interface LoggedWorkout {
  source: "session" | "activity";
  id: string;
  date: string;
  label: string;
  entries: unknown[];
}

// A plain <form action={...}> here would crash to Next's generic error
// screen on anything the action throws (nothing picked slipping past a
// missing `required`, a workout that's since been deleted, a race) --
// this wraps the same call in a client component so a failure shows an
// inline message instead of wiping the page.
export function SetDayFromWorkoutForm({
  clientId,
  target,
  recentLoggedWorkouts,
}: {
  clientId: string;
  target: { programDayId: string } | { extraDayId: string };
  recentLoggedWorkouts: LoggedWorkout[];
}) {
  const router = useRouter();
  const [sourceKey, setSourceKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (recentLoggedWorkouts.length === 0) return null;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!sourceKey) {
      setError("Pick a workout first.");
      return;
    }
    startTransition(async () => {
      try {
        await setProgramDayFromLoggedWorkout(clientId, target, sourceKey);
        setSourceKey("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 flex flex-wrap items-center gap-2">
      <Select
        value={sourceKey}
        onChange={(e) => setSourceKey(e.target.value)}
        className="max-w-xs"
      >
        <option value="">— Use a recent logged workout instead —</option>
        {recentLoggedWorkouts.map((w) => (
          <option key={`${w.source}-${w.id}`} value={`${w.source}:${w.id}`}>
            {w.date} — {w.label} ({w.entries.length} exercises
            {w.source === "activity" ? ", class" : ""})
          </option>
        ))}
      </Select>
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Setting…" : "Set as this day"}
      </Button>
      {error ? <p className="w-full text-sm text-pink">{error}</p> : null}
    </form>
  );
}
