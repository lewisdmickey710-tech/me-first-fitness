"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, Collapsible, EmptyState, Select } from "@/components/ui";
import { LATERALITIES, MOVEMENT_TYPES, MUSCLE_GROUPS } from "@/lib/constants";
import type { Exercise } from "@/lib/types";

export function LibraryFilterList({ exercises }: { exercises: Exercise[] }) {
  const [query, setQuery] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [movementType, setMovementType] = useState("");
  const [laterality, setLaterality] = useState("");

  const byId = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      if (muscleGroup && ex.primary_muscle_group !== muscleGroup) return false;
      if (movementType && ex.movement_type !== movementType) return false;
      if (laterality && ex.laterality !== laterality) return false;
      return true;
    });
  }, [exercises, query, muscleGroup, movementType, laterality]);

  return (
    <div className="space-y-4">
      <div className="sticky top-9 z-10 -mx-4 bg-bg px-4 pb-2 pt-1">
        <Card className="space-y-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-xl border border-grayLt bg-white px-3 py-2 text-sm text-ink placeholder:text-gray/60 focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose"
          />
          <div className="grid grid-cols-3 gap-2">
            <Select
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
            >
              <option value="">All muscle groups</option>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
            <Select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
            >
              <option value="">Compound or accessory</option>
              {MOVEMENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
            <Select
              value={laterality}
              onChange={(e) => setLaterality(e.target.value)}
            >
              <option value="">Single or two-limb</option>
              {LATERALITIES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center justify-between text-xs text-gray">
            <span>
              {query || muscleGroup || movementType || laterality
                ? `${filtered.length} of ${exercises.length} exercises`
                : `${exercises.length} exercises`}
            </span>
            <div className="flex items-center gap-3">
              {query || muscleGroup || movementType || laterality ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setMuscleGroup("");
                    setMovementType("");
                    setLaterality("");
                  }}
                  className="text-rose hover:underline"
                >
                  Clear filters
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-gray hover:text-ink"
              >
                ↑ Top
              </button>
            </div>
          </div>
        </Card>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          body="Try a different search term or clear a filter."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((ex) => (
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

              <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-gray">
                {ex.primary_muscle_group ? (
                  <span className="rounded-full bg-cream px-2 py-0.5">
                    {ex.primary_muscle_group}
                  </span>
                ) : null}
                {ex.movement_type ? (
                  <span className="rounded-full bg-cream px-2 py-0.5">
                    {MOVEMENT_TYPES.find((t) => t.id === ex.movement_type)?.label}
                  </span>
                ) : null}
                {ex.laterality ? (
                  <span className="rounded-full bg-cream px-2 py-0.5">
                    {ex.laterality === "unilateral" ? "Single-limb" : "Two-limb"}
                  </span>
                ) : null}
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
