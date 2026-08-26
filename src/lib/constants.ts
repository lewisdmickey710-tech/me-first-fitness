export const PHASES = [
  { id: "1", name: "Phase 1 — Stability", color: "#4A9A9A" },
  { id: "2", name: "Phase 2 — Strength", color: "#E75480" },
  { id: "3", name: "Phase 3 — Size", color: "#5D8A5E" },
  { id: "4", name: "Phase 4 — Power", color: "#C9A96E" },
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
