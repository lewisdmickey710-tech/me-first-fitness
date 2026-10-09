"use client";

import { useState, useTransition } from "react";
import { setItemReply } from "@/app/coach/actions";
import { Button, Textarea } from "@/components/ui";

const QUICK_EMOJI = ["🔥", "💪", "👏", "❤️"];

export function ItemReplyEditor({
  clientId,
  itemType,
  itemId,
  initialEmoji,
  initialNote,
}: {
  clientId: string;
  itemType: "activity" | "nutrition";
  itemId: string;
  initialEmoji: string | null;
  initialNote: string | null;
}) {
  const [emoji, setEmoji] = useState(initialEmoji);
  const [note, setNote] = useState(initialNote ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save(nextEmoji: string | null, nextNote: string) {
    setSaved(false);
    startTransition(async () => {
      await setItemReply(clientId, itemType, itemId, nextEmoji, nextNote);
      setSaved(true);
    });
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-grayLt bg-bg/50 p-2.5">
      <p className="text-xs font-medium text-gray">Reply to client (they&apos;ll see this)</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {QUICK_EMOJI.map((e) => (
          <button
            key={e}
            type="button"
            disabled={pending}
            onClick={() => {
              const next = emoji === e ? null : e;
              setEmoji(next);
              save(next, note);
            }}
            className={`rounded-full border px-2 py-1 text-base transition ${
              emoji === e ? "border-rose bg-rose/10" : "border-grayLt bg-white hover:border-rose/40"
            }`}
            aria-pressed={emoji === e}
          >
            {e}
          </button>
        ))}
      </div>
      <Textarea
        rows={2}
        placeholder="Optional note..."
        value={note}
        disabled={pending}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => save(emoji, note)}
        >
          Save reply
        </Button>
        {saved && !pending ? <span className="text-xs text-teal">Saved ✓</span> : null}
      </div>
    </div>
  );
}
