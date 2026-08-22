import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, Collapsible, EmptyState, Heart } from "@/components/ui";
import type { Exercise } from "@/lib/types";

export default async function LibraryPage() {
  const supabase = await createClient();

  const { data: exercises } = (await supabase
    .from("exercises")
    .select("*")
    .order("name")) as { data: Exercise[] | null };

  const byId = new Map((exercises ?? []).map((e) => [e.id, e]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          Exercise library
        </h1>
        <Link
          href="/coach/library/new"
          className="rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Add exercise
        </Link>
      </div>

      <p className="text-sm text-gray">
        Everything here is what clients see in their program and what
        you&apos;ll pull from when building templates. Descriptions and cues
        stay collapsed until tapped, so the list stays easy to scan.
      </p>

      {!exercises || exercises.length === 0 ? (
        <EmptyState
          title="No exercises yet"
          body="Add your first movement to start building out the library."
        />
      ) : (
        <div className="space-y-3">
          {exercises.map((ex) => (
            <Card key={ex.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-ink">{ex.name}</p>
                <Link
                  href={`/coach/library/${ex.id}`}
                  className="shrink-0 text-sm text-gray hover:text-ink"
                >
                  Edit
                </Link>
              </div>

              <div className="mt-2 space-y-2">
                {ex.client_description ? (
                  <Collapsible label="Client description">
                    <p className="whitespace-pre-wrap text-sm text-ink">
                      {ex.client_description}
                    </p>
                  </Collapsible>
                ) : null}

                {ex.coach_cues ? (
                  <Collapsible label="Coach cues">
                    <p className="whitespace-pre-wrap text-sm text-ink">
                      {ex.coach_cues}
                    </p>
                  </Collapsible>
                ) : null}
              </div>

              {(ex.regress_to_id || ex.progress_to_id) && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray">
                  {ex.regress_to_id ? (
                    <span>
                      Regress to:{" "}
                      <span className="text-ink">
                        {byId.get(ex.regress_to_id)?.name ?? "—"}
                      </span>
                    </span>
                  ) : null}
                  {ex.progress_to_id ? (
                    <span>
                      Progress to:{" "}
                      <span className="text-ink">
                        {byId.get(ex.progress_to_id)?.name ?? "—"}
                      </span>
                    </span>
                  ) : null}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
