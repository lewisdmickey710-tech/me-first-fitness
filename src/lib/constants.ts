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
  { id: "unilateral", label: "Single-limb (unilateral)" },
] as const;

export const ACTIVITY_TYPES = [
  "Class",
  "Coaching session",
  "Workout with friends",
  "Active recovery / walk",
  "Other",
] as const;

export type PhaseId = (typeof PHASES)[number]["id"];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export function phaseInfo(id: string) {
  return PHASES.find((p) => p.id === id) ?? PHASES[PHASES.length - 1];
}
