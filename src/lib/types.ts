export type Role = "coach" | "client";

export interface Profile {
  id: string;
  role: Role;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  track: string;
  phase: string;
  sessions_allotted: number | null;
  notes: string | null;
  created_at: string;
  user_id: string | null;
  care_profile_id: string | null;
  days_per_week: 1 | 2 | 3 | null;
  session_mode: "in_person" | "virtual" | "mixed" | null;
}

export interface SessionEntry {
  exercise: string;
  sets: string;
  reps: string;
  weight: string;
}

export interface TrainingSession {
  id: string;
  client_id: string;
  day_label: string;
  date: string;
  entries: SessionEntry[];
  rating: number | null;
  day_notes: string | null;
  logged_by: string;
  created_at: string;
}

export interface Checkin {
  id: string;
  client_id: string;
  date: string;
  sleep: string | null;
  water: string | null;
  food: string | null;
  energy: string | null;
  mood: string | null;
  notes: string | null;
  logged_by: "coach" | "client";
  created_at: string;
}

export interface Activity {
  id: string;
  client_id: string;
  date: string;
  type: string;
  duration: string | null;
  notes: string | null;
  created_at: string;
}

export type RequestStatus = "pending" | "confirmed" | "declined";

export interface SessionRequest {
  id: string;
  client_id: string;
  preferred_date: string;
  preferred_time: string | null;
  note: string | null;
  status: RequestStatus;
  created_at: string;
}

export type Phase = "1" | "2" | "3" | "4";

export interface CareProfile {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  client_description: string | null;
  coach_cues: string | null;
  regress_to_id: string | null;
  progress_to_id: string | null;
  created_at: string;
}

export interface ProgramDay {
  id: string;
  care_profile_id: string;
  phase: Phase;
  day_number: 1 | 2 | 3;
  day_label: string;
  created_at: string;
}

export interface ProgramDayExercise {
  id: string;
  program_day_id: string;
  exercise_id: string;
  position: number;
  superset_group: string | null;
  sets: string | null;
  reps: string | null;
  created_at: string;
}

export interface ClientPhaseHistory {
  id: string;
  client_id: string;
  cycle_number: number;
  phase: Phase;
  started_on: string;
  planned_weeks: number;
  ended_on: string | null;
  created_at: string;
}

export interface ClientProgramOverride {
  id: string;
  client_id: string;
  program_day_exercise_id: string;
  substitute_exercise_id: string | null;
  sets_override: string | null;
  reps_override: string | null;
  edited_by: "coach" | "client";
  active: boolean;
  created_at: string;
}

export interface Measurement {
  id: string;
  client_id: string;
  date: string;
  weight: number | null;
  neck: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  thigh_l: number | null;
  thigh_r: number | null;
  bicep_l: number | null;
  bicep_r: number | null;
  notes: string | null;
  logged_by: "coach" | "client";
  created_at: string;
}
