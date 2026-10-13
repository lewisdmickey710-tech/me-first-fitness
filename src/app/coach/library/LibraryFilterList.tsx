"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Collapsible, EmptyState, Select } from "@/components/ui";
import {
  LATERALITIES,
  MOVEMENT_PATTERNS,
  MOVEMENT_TYPES,
  MUSCLE_GROUPS,
  PLANES_OF_MOTION,
} from "@/lib/constants";
import { bulkTagExercises } from "@/app/coach/library/actions";
import type { Exercise } from "@/lib/types";

const MOVEMENT_TYPE_LABEL = new Map(MOVEMENT_TYPES.map((t) => [t.id, t.label]));
const LATERALITY_LABEL = new Map(LATERALITIES.map((l) => [l.id, l.label]));
const MOVEMENT_PATTERN_LABEL = new Map(MOVEMENT_PATTERNS.map((p) => [p.id, p.label]));
const PLANE_OF_MOTION_LABEL = new Map(PLANES_OF_MOTION.map((p) => [p.id, p.label]));

// The search box matches tags as well as the name -- typing "lunge" finds
// a Bulgarian split squat tagged movement_pattern="lunge" even though the
// word never appears in its name.
function searchBlob(ex: Exercise): string {
  return [
    ex.name,
    ex.primary_muscle_group,
    ex.movement_type && MOVEMENT_TYPE_LABEL.get(ex.movement_type),
    ex.laterality && LATERALITY_LABEL.get(ex.laterality),
    ex.movement_pattern && MOVEMENT_PATTERN_LABEL.get(ex.movement_pattern),
    ex.plane_of_motion && PLANE_OF_MOTION_LABEL.get(ex.plane_of_motion),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function LibraryFilterList({ exercises }: { exercises: Exercise[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [movementType, setMovementType] = useState("");
  const [laterality, setLaterality] = useState("");
  const [movementPattern, setMovementPattern] = useState("");
  const [planeOfMotion, setPlaneOfMotion] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPattern, setBulkPattern] = useState("");
  const [bulkPlane, setBulkPlane] = useState("");
  const [bulkMuscleGroup, setBulkMuscleGroup] = useState("");
  const [bulkMovementType, setBulkMovementType] = useState("");
  const [bulkLaterality, setBulkLaterality] = useState("");
  const [isPending, startTransition] = useTransition();
  const [bulkError, setBulkError] = useState<string | null>(null);

  const byId = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises]
  );

  const anyFilterActive =
    !!query || !!muscleGroup || !!movementType || !!laterality || !!movementPattern || !!planeOfMotion;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (q && !searchBlob(ex).includes(q)) return false;
      if (muscleGroup && ex.primary_muscle_group !== muscleGroup) return false;
      if (movementType && ex.movement_type !== movementType) return false;
      if (laterality && ex.laterality !== laterality) return false;
      if (movementPattern && ex.movement_pattern !== movementPattern) return false;
      if (planeOfMotion && ex.plane_of_motion !== planeOfMotion) return false;
      return true;
    });
  }, [exercises, query, muscleGroup, movementType, laterality, movementPattern, planeOfMotion]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedIds(new Set(filtered.map((ex) => ex.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function applyBulkTag() {
    setBulkError(null);
    const fields: Parameters<typeof bulkTagExercises>[1] = {};
    if (bulkPattern) fields.movement_pattern = bulkPattern;
    if (bulkPlane) fields.plane_of_motion = bulkPlane;
    if (bulkMuscleGroup) fields.primary_muscle_group = bulkMuscleGroup;
    if (bulkMovementType) fields.movement_type = bulkMovementType;
    if (bulkLaterality) fields.laterality = bulkLaterality;

    if (Object.keys(fields).length === 0) {
      setBulkError("Pick at least one tag to apply.");
      return;
    }

    startTransition(async () => {
      try {
        await bulkTagExercises([...selectedIds], fields);
        clearSelection();
        setBulkPattern("");
        setBulkPlane("");
        setBulkMuscleGroup("");
        setBulkMovementType("");
        setBulkLaterality("");
        router.refresh();
      } catch (err) {
        setBulkError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-9 z-10 -mx-4 bg-bg px-4 pb-2 pt-1">
        <Card className="space-y-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or tag (e.g. lunge, sagittal, glutes)..."
            className="w-full rounded-xl border border-grayLt bg-white px-3 py-2 text-sm text-ink placeholder:text-gray/60 focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
            <Select
              value={movementPattern}
              onChange={(e) => setMovementPattern(e.target.value)}
            >
              <option value="">All movement patterns</option>
              {MOVEMENT_PATTERNS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
            <Select
              value={planeOfMotion}
              onChange={(e) => setPlaneOfMotion(e.target.value)}
            >
              <option value="">All planes of motion</option>
              {PLANES_OF_MOTION.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center justify-between text-xs text-gray">
            <span>
              {anyFilterActive
                ? `${filtered.length} of ${exercises.length} exercises`
                : `${exercises.length} exercises`}
            </span>
            <div className="flex items-center gap-3">
              {anyFilterActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setMuscleGroup("");
                    setMovementType("");
                    setLaterality("");
                    setMovementPattern("");
                    setPlaneOfMotion("");
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

      <Card className="space-y-3 border-rose/30 bg-rose/5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-ink">
            {selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : "Bulk-tag exercises"}
          </p>
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={selectAllFiltered}
              className="text-rose hover:underline"
            >
              Select all {anyFilterActive ? `${filtered.length} filtered` : "shown"}
            </button>
            {selectedIds.size > 0 ? (
              <button
                type="button"
                onClick={clearSelection}
                className="text-gray hover:text-ink"
              >
                Clear selection
              </button>
            ) : null}
          </div>
        </div>

        {selectedIds.size > 0 ? (
          <>
            <p className="text-xs text-gray">
              Set a tag below and apply it to every selected exercise at
              once. Leave a dropdown on &quot;Leave unchanged&quot; to skip
              it -- only the tags you pick here get touched.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Select value={bulkMuscleGroup} onChange={(e) => setBulkMuscleGroup(e.target.value)}>
                <option value="">Muscle group: leave unchanged</option>
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
              <Select value={bulkMovementType} onChange={(e) => setBulkMovementType(e.target.value)}>
                <option value="">Movement type: leave unchanged</option>
                {MOVEMENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
              <Select value={bulkLaterality} onChange={(e) => setBulkLaterality(e.target.value)}>
                <option value="">Laterality: leave unchanged</option>
                {LATERALITIES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </Select>
              <Select value={bulkPattern} onChange={(e) => setBulkPattern(e.target.value)}>
                <option value="">Movement pattern: leave unchanged</option>
                {MOVEMENT_PATTERNS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
              <Select value={bulkPlane} onChange={(e) => setBulkPlane(e.target.value)}>
                <option value="">Plane of motion: leave unchanged</option>
                {PLANES_OF_MOTION.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
            {bulkError ? <p className="text-sm text-pink">{bulkError}</p> : null}
            <button
              type="button"
              onClick={applyBulkTag}
              disabled={isPending}
              className="rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Applying…" : `Apply to ${selectedIds.size} selected`}
            </button>
          </>
        ) : (
          <p className="text-xs text-gray">
            Select exercises below (check the box on each card) to tag many
            at once -- filter down to a group first (e.g. search
            &quot;lunge&quot;), select all, then apply the tag.
          </p>
        )}
      </Card>

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
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(ex.id)}
                    onChange={() => toggleSelected(ex.id)}
                    className="mt-1 h-4 w-4 rounded border-grayLt text-rose focus:ring-1 focus:ring-rose"
                  />
                  <p className="font-medium text-ink">{ex.name}</p>
                </label>
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
                    {MOVEMENT_TYPE_LABEL.get(ex.movement_type)}
                  </span>
                ) : null}
                {ex.laterality ? (
                  <span className="rounded-full bg-cream px-2 py-0.5">
                    {LATERALITY_LABEL.get(ex.laterality) ?? ex.laterality}
                  </span>
                ) : null}
                {ex.movement_pattern ? (
                  <span className="rounded-full bg-teal/10 px-2 py-0.5 text-teal">
                    {MOVEMENT_PATTERN_LABEL.get(ex.movement_pattern)}
                  </span>
                ) : null}
                {ex.plane_of_motion ? (
                  <span className="rounded-full bg-teal/10 px-2 py-0.5 text-teal">
                    {PLANE_OF_MOTION_LABEL.get(ex.plane_of_motion)}
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
