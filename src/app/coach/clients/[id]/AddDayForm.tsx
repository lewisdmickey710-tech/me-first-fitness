"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addExtraProgramDay } from "@/app/coach/actions";
import { Button, Input } from "@/components/ui";

// Same reasoning as SetDayFromWorkoutForm -- addExtraProgramDay throws on
// a blank label, and a plain <form action={...}> has no way to show that
// inline, so it crashed to Next's generic error screen instead. This
// wraps the call with proper error handling.
export function AddDayForm({ clientId, phase }: { clientId: string; phase: string }) {
  const router = useRouter();
  const [dayLabel, setDayLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!dayLabel.trim()) {
      setError("Give the day a name first.");
      return;
    }
    const formData = new FormData();
    formData.set("day_label", dayLabel.trim());

    startTransition(async () => {
      try {
        await addExtraProgramDay(clientId, phase, formData);
        setDayLabel("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="e.g. Core & Mobility"
        className="max-w-xs"
        value={dayLabel}
        onChange={(e) => setDayLabel(e.target.value)}
      />
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Adding…" : "+ Add day"}
      </Button>
      {error ? <p className="w-full text-sm text-pink">{error}</p> : null}
    </form>
  );
}
