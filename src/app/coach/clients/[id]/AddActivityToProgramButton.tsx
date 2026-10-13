"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProgramDayFromActivity } from "@/app/coach/actions";
import { Button } from "@/components/ui";

// Same reasoning as the other day forms in this folder -- a plain
// <form action={...}> has no way to show what the action throws inline,
// so any failure (an activity that's since been deleted, a race) crashed
// to Next's generic error screen instead of a message on the card.
export function AddActivityToProgramButton({
  clientId,
  phase,
  activityId,
}: {
  clientId: string;
  phase: string;
  activityId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    setError(null);
    startTransition(async () => {
      try {
        await setProgramDayFromActivity(clientId, { newDayPhase: phase }, activityId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div>
      <Button type="button" variant="secondary" onClick={onClick} disabled={isPending}>
        {isPending ? "Adding…" : "Add as a new day"}
      </Button>
      {error ? <p className="mt-1 text-sm text-pink">{error}</p> : null}
    </div>
  );
}
