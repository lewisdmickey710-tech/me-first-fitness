"use client";

import { useState, useTransition } from "react";
import { sendTrackingNudge } from "@/app/coach/actions";
import { Button } from "@/components/ui";

// A one-click "nudge to track" for dropping onto any card/banner that
// already shows a client's name -- the roster, the dashboard's various
// lists, anywhere. Always sends the generic default message (no custom
// text here, by design -- for that, use the full nudge form on the
// client's own page). Renders nothing for a client with no login linked,
// since sendTrackingNudge has nowhere to push to.
export function NudgeButton({
  clientId,
  userId,
}: {
  clientId: string;
  userId: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!userId) return null;

  function onClick() {
    setError(null);
    startTransition(async () => {
      try {
        await sendTrackingNudge(clientId, new FormData());
        setSent(true);
        setTimeout(() => setSent(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't send.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="secondary" onClick={onClick} disabled={isPending}>
        {isPending ? "Sending…" : sent ? "Sent ✓" : "Nudge"}
      </Button>
      {error ? <p className="text-xs text-pink">{error}</p> : null}
    </div>
  );
}
