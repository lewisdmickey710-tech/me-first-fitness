import type { TrackId, PhaseId } from "@/lib/constants";

export interface ProgramExercise {
  exercise: string;
  sets: string;
  reps: string;
}

export interface ProgramDay {
  label: string;
  exercises: ProgramExercise[];
}

/**
 * Per-track, per-phase workout content, used to pre-fill the Log Session
 * form. Populated only for tracks whose exercise content has been verified
 * — an unlisted track/phase simply falls back to a blank form. Do not add
 * partial or best-guess entries here: a wrong exercise in a real program
 * (especially for postpartum, senior, or chronic-illness tracks) is worse
 * than no suggestion at all.
 */
export const TRACK_PROGRAMS: Partial<
  Record<TrackId, Partial<Record<PhaseId, ProgramDay[]>>>
> = {};

export function getProgramDays(
  track: string,
  phase: string
): ProgramDay[] | null {
  return TRACK_PROGRAMS[track as TrackId]?.[phase as PhaseId] ?? null;
}
