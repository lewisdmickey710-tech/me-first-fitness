export const PHASES = [
  { id: "1", name: "Phase 1 — Stability", color: "#4A9A9A" },
  { id: "2", name: "Phase 2 — Strength", color: "#E75480" },
  { id: "3", name: "Phase 3 — Size", color: "#5D8A5E" },
  { id: "4", name: "Phase 4 — Speed", color: "#C9A96E" },
  { id: "n/a", name: "N/A", color: "#B9829A" },
] as const;

export const MUSCLE_GROUPS = [
  "Glutes",
  "Hamstrings",
  "Quads",
  "Calves",
  "Adductors",
  "Abductors",
  "Back",
  "Chest",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Core",
  "Full Body",
  "Balance/Mobility",
] as const;

export const MOVEMENT_TYPES = [
  { id: "compound", label: "Compound" },
  { id: "accessory", label: "Accessory" },
  { id: "mobility", label: "Mobility" },
] as const;

export const LATERALITIES = [
  { id: "bilateral", label: "Two-limb (bilateral)" },
  { id: "per_arm", label: "Single-limb — per arm" },
  { id: "per_leg", label: "Single-limb — per leg" },
  { id: "per_side", label: "Single-limb — per side (rotational core, etc.)" },
] as const;

// Groups exercises that are variations of the same movement (a reverse
// lunge, a glute-dominant step-up, and a Bulgarian split squat are all
// "lunge") so they can be searched/filtered together and offered as swap
// suggestions, independent of the regress_to/progress_to difficulty chain.
export const MOVEMENT_PATTERNS = [
  { id: "squat", label: "Squat" },
  { id: "hinge", label: "Hinge" },
  { id: "lunge", label: "Lunge" },
  { id: "push", label: "Push" },
  { id: "pull", label: "Pull" },
  { id: "rotation", label: "Rotation" },
  { id: "gait", label: "Gait / Locomotion" },
  { id: "carry", label: "Carry" },
  { id: "core", label: "Core / Isometric" },
  { id: "mobility", label: "Mobility" },
  { id: "other", label: "Other" },
] as const;

export const PLANES_OF_MOTION = [
  { id: "sagittal", label: "Sagittal (forward/back)" },
  { id: "frontal", label: "Frontal (side-to-side)" },
  { id: "transverse", label: "Transverse (rotational)" },
  { id: "multi_planar", label: "Multi-planar" },
] as const;

// A short "Lunge · Sagittal · Glutes" label built from an exercise's
// tags -- used both to show context next to its name (library list,
// exercise-picker suggestions) and as extra searchable text, so typing a
// tag finds exercises whose tags match even when the word isn't in the
// name.
export function exerciseTagLabel(ex: {
  movement_pattern?: string | null;
  plane_of_motion?: string | null;
  primary_muscle_group?: string | null;
}): string {
  const pattern = MOVEMENT_PATTERNS.find((p) => p.id === ex.movement_pattern)?.label;
  const plane = PLANES_OF_MOTION.find((p) => p.id === ex.plane_of_motion)?.label;
  return [pattern, plane, ex.primary_muscle_group].filter(Boolean).join(" · ");
}

const MOVEMENT_PATTERN_LABEL = new Map<string, string>(
  MOVEMENT_PATTERNS.map((p) => [p.id, p.label])
);

// Groups any list of exercise-shaped options by movement pattern (for
// rendering as native <optgroup>s) so a plain dropdown over the
// ~1,340-exercise library is at least scannable by movement family
// instead of one flat alphabetical list. Untagged exercises fall into
// their own group at the end; tagged groups sort alphabetically by label.
export function groupExercisesByPattern<T extends { movement_pattern: string | null }>(
  options: T[]
): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const ex of options) {
    const key = ex.movement_pattern
      ? MOVEMENT_PATTERN_LABEL.get(ex.movement_pattern) ?? ex.movement_pattern
      : "Untagged";
    const list = groups.get(key) ?? [];
    list.push(ex);
    groups.set(key, list);
  }
  const untagged = groups.get("Untagged");
  groups.delete("Untagged");
  const sorted = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  if (untagged) sorted.push(["Untagged", untagged]);
  return sorted;
}

const LATERALITY_SUFFIX: Record<string, string> = {
  per_arm: "per arm",
  per_leg: "per leg",
  per_side: "per side",
};

// Appends "per arm"/"per leg"/"per side" to a prescribed rep count when
// the exercise is single-limb, so a coach never has to type it into the
// free-text reps field by hand -- skips it if that wording (or "each
// side") is already present, in case someone did type it manually.
export function formatReps(
  reps: string | null | undefined,
  laterality: string | null | undefined
): string {
  const base = reps ?? "";
  if (!base || !laterality || laterality === "bilateral") return base;
  const suffix = LATERALITY_SUFFIX[laterality];
  if (!suffix) return base;
  if (/per (arm|leg|side)|each side/i.test(base)) return base;
  return `${base} ${suffix}`;
}

export const ACTIVITY_TYPES = [
  "Class",
  "Workout with friends",
  "Mobility",
  "Active recovery / walk",
  "Other",
] as const;

export type PhaseId = (typeof PHASES)[number]["id"];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export function phaseInfo(id: string) {
  return PHASES.find((p) => p.id === id) ?? PHASES[PHASES.length - 1];
}
