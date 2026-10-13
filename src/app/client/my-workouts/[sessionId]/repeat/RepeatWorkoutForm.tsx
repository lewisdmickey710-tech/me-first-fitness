"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logRepeatWorkout } from "@/app/client/actions";
import { Button, Input, StarRatingInput, Textarea } from "@/components/ui";
import { WeightInput } from "@/components/weight-input";
import type { SessionEntry } from "@/lib/types";

export function RepeatWorkoutForm({
  sourceSessionId,
  entries,
  today,
}: {
  sourceSessionId: string;
  entries: SessionEntry[];
  today: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await logRepeatWorkout(sourceSessionId, formData);
        router.push("/client/my-workouts?logged=1");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Date</label>
        <Input name="date" type="date" required defaultValue={today} />
      </div>

      <div className="space-y-3">
        {entries.map((e, i) => (
          <div key={i} className="space-y-1 rounded-xl border border-grayLt p-3">
            <p className="text-sm font-medium text-ink">
              {e.exercise}
              {e.sets || e.reps ? (
                <span className="font-normal text-gray"> — {e.sets}x{e.reps}</span>
              ) : null}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <WeightInput name="weight" placeholder="Weight used" />
              <Input name="notes" placeholder="Notes (optional)" />
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Anything else about how this went?
        </label>
        <Textarea name="day_notes" rows={2} />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-ink">Rate this workout</p>
        <StarRatingInput name="rating" />
      </div>

      {error ? <p className="text-sm text-pink">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Log this workout"}
      </Button>
    </form>
  );
}
