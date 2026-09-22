"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logMyWorkout } from "@/app/client/actions";
import { uploadFormCheckFile } from "@/lib/upload-client";

// The day's log form (id={id}) is the only actual <form> element -- every
// weight/notes/file input for each exercise lives elsewhere in the page
// (inside that exercise's own box) and joins this form purely via the
// HTML form="..." attribute, so new FormData(form) still picks all of it
// up regardless of where in the DOM it rendered.
export function WorkoutLogForm({
  id,
  dayId,
  clientId,
  pdeIds,
  children,
}: {
  id: string;
  dayId: string;
  clientId: string;
  pdeIds: string[];
  children: React.ReactNode;
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
        for (const pdeId of pdeIds) {
          const file = formData.get(`file_${pdeId}`);
          formData.delete(`file_${pdeId}`);
          if (file instanceof File && file.size > 0) {
            const path = await uploadFormCheckFile(clientId, "workout", file);
            formData.set(`media_path_${pdeId}`, path);
          }
        }
        const dayNumber = await logMyWorkout(dayId, formData);
        router.push(`/client/program?logged=${encodeURIComponent(dayNumber)}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form
      id={id}
      onSubmit={onSubmit}
      className="mt-4 space-y-4 border-t border-grayLt pt-4"
    >
      {children}
      {error ? <p className="text-sm text-pink">{error}</p> : null}
      {isPending ? <p className="text-sm text-gray">Saving…</p> : null}
    </form>
  );
}
