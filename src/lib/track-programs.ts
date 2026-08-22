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
 *
 * Source: mff_exercise_library.py (verified content only, gaps marked by
 * its own author). Track A Phase 2 omits two exercise pairs whose B-side
 * was never confirmed there — left out here rather than guessed. Track A
 * Phases 3/4 don't exist as generic content anywhere yet (only a
 * client-specific variant does, which isn't a safe stand-in for a general
 * template). Tracks I and J still need a same-quality source — the PDFs
 * received earlier had exercise names cut off by page-width truncation.
 */
export const TRACK_PROGRAMS: Partial<
  Record<TrackId, Partial<Record<PhaseId, ProgramDay[]>>>
> = {
  A: {
    "1": [
      {
        label: "Legs & Glutes",
        exercises: [
          { exercise: "Single-Leg Glute Bridge", sets: "2", reps: "15" },
          { exercise: "Goblet Squat (Bosu Ball)", sets: "2", reps: "15" },
          { exercise: "Single-Leg RDL", sets: "2", reps: "15" },
          { exercise: "Lateral Band Walk", sets: "2", reps: "15" },
          { exercise: "Single-Leg Calf Raise", sets: "2", reps: "12" },
          {
            exercise: "Ab/Core: Bird Dog + Glute Bridge March",
            sets: "2",
            reps: "12",
          },
        ],
      },
      {
        label: "Push",
        exercises: [
          {
            exercise: "Push-Up w/ Leg Lift (or Light DB Bench Press)",
            sets: "2",
            reps: "12",
          },
          { exercise: "Single-Leg DB Shoulder Press", sets: "2", reps: "12" },
          {
            exercise: "Single-Leg Band Tricep Pushdown",
            sets: "2",
            reps: "12",
          },
          {
            exercise: "Single-Leg DB Chest Fly (standing)",
            sets: "2",
            reps: "12",
          },
          { exercise: "Single-Leg Lateral Raise", sets: "2", reps: "12" },
          { exercise: "Ab/Core: Dead Bug + Leg Raise", sets: "2", reps: "12" },
        ],
      },
      {
        label: "Pull",
        exercises: [
          { exercise: "Single-Leg Band Row", sets: "2", reps: "12" },
          {
            exercise: "Band Lat Pulldown / Assisted Pull-Up",
            sets: "2",
            reps: "12",
          },
          { exercise: "Single-Leg DB Bicep Curl", sets: "2", reps: "12" },
          { exercise: "Single-Leg Face Pull", sets: "2", reps: "12" },
          { exercise: "Single-Leg Hip Thrust", sets: "2", reps: "15" },
          {
            exercise: "Ab/Core: 90/90 Breathing + Bird Dog",
            sets: "2",
            reps: "10",
          },
        ],
      },
    ],
    "2": [
      {
        label: "Legs & Glutes",
        exercises: [
          { exercise: "Sumo Squat", sets: "3", reps: "10" },
          { exercise: "Bosu Ball Squat", sets: "3", reps: "15" },
          { exercise: "DB/Barbell Bench Press", sets: "3", reps: "10" },
          { exercise: "DB Ball Chest Press", sets: "3", reps: "15" },
          { exercise: "Sumo RDL", sets: "3", reps: "10" },
          { exercise: "Single-Leg RDL", sets: "3", reps: "15" },
          { exercise: "Barbell/DB Row", sets: "3", reps: "10" },
          { exercise: "Single-Leg Bent-Over Row", sets: "3", reps: "15" },
          { exercise: "Hip Thrust (barbell)", sets: "3", reps: "10" },
          { exercise: "Single-Leg Hip Thrust", sets: "3", reps: "15" },
        ],
      },
      {
        label: "Push",
        exercises: [
          { exercise: "Deadlift (conv./trap bar)", sets: "3", reps: "8" },
          { exercise: "Glute Bridge (loaded)", sets: "3", reps: "15" },
          { exercise: "Incline DB Press", sets: "3", reps: "8" },
          { exercise: "Single-Leg Glute Bridge", sets: "3", reps: "12" },
          { exercise: "Bulgarian Split Squat", sets: "3", reps: "10" },
          { exercise: "Lateral Lunge", sets: "3", reps: "12" },
          { exercise: "Face Pull", sets: "3", reps: "10" },
          { exercise: "Push-Up (feet elevated)", sets: "3", reps: "12" },
          { exercise: "Hip Thrust (heavy)", sets: "3", reps: "8" },
          { exercise: "Standing Glute Kickback", sets: "3", reps: "15" },
        ],
      },
      {
        label: "Pull",
        exercises: [
          { exercise: "Front/Goblet Squat (heavier)", sets: "3", reps: "8" },
          { exercise: "Step-Up (loaded)", sets: "3", reps: "12" },
          { exercise: "Pull-Up / Lat Pulldown", sets: "3", reps: "8" },
          { exercise: "Romanian Deadlift", sets: "3", reps: "10" },
          { exercise: "Curtsy Lunge", sets: "3", reps: "12" },
          { exercise: "Chest Press (DB/Machine)", sets: "3", reps: "8" },
          { exercise: "Hip Abduction (band/cable)", sets: "3", reps: "12" },
          { exercise: "Suitcase Carry", sets: "3", reps: "15" },
        ],
      },
    ],
  },
};

export function getProgramDays(
  track: string,
  phase: string
): ProgramDay[] | null {
  return TRACK_PROGRAMS[track as TrackId]?.[phase as PhaseId] ?? null;
}
