export const TRACKS = [
  { id: "A", name: "3-Day PPL" },
  { id: "A.2", name: "3-Day Full Body + Bonus" },
  { id: "B", name: "2-Day Upper/Lower + Class" },
  { id: "C", name: "Once-Weekly Full Body" },
  { id: "C.2", name: "3-Day Repeat & Relearn" },
  { id: "C.3", name: "3-Day Chronic Illness" },
  { id: "D", name: "Rehab-Forward" },
  { id: "E", name: "Once-Weekly + Home" },
  { id: "F", name: "Medically Conservative" },
  { id: "G", name: "Virtual-Only" },
  { id: "H", name: "High-Touch 3x/Week Coached" },
  { id: "I", name: "Senior / Fall-Prevention" },
  { id: "J", name: "Postpartum / Pelvic-Health" },
] as const;

export const PHASES = [
  { id: "1", name: "Phase 1 — Stability", color: "#4A9A9A" },
  { id: "2", name: "Phase 2 — Strength", color: "#E75480" },
  { id: "3", name: "Phase 3 — Size", color: "#5D8A5E" },
  { id: "4", name: "Phase 4 — Power", color: "#C9A96E" },
  { id: "n/a", name: "N/A", color: "#B9829A" },
] as const;

export const ACTIVITY_TYPES = [
  "Class",
  "Coaching session",
  "Workout with friends",
  "Active recovery / walk",
  "Other",
] as const;

export type TrackId = (typeof TRACKS)[number]["id"];
export type PhaseId = (typeof PHASES)[number]["id"];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export function trackName(id: string): string {
  return TRACKS.find((t) => t.id === id)?.name ?? id;
}

export function phaseInfo(id: string) {
  return PHASES.find((p) => p.id === id) ?? PHASES[PHASES.length - 1];
}
