export type Role = "coach" | "client" | "lead";

export interface Profile {
  id: string;
  role: Role;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  track: string | null;
  phase: string | null;
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

export interface CareProfilePhaseNotes {
  id: string;
  care_profile_id: string;
  phase: Phase;
  headline: string | null;
  coach_tips: string | null;
  extra_care: string | null;
  cardio_guidance: string | null;
  created_at: string;
}

export interface ServiceCheckin {
  id: string;
  client_id: string;
  date: string;
  satisfaction: number | null;
  what_working: string | null;
  what_would_help: string | null;
  anything_else: string | null;
  created_at: string;
}

export interface ClientSchedule {
  id: string;
  client_id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  time_of_day: string;
  label: string | null;
  active: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  client_id: string;
  description: string;
  amount: number;
  due_date: string;
  paid_on: string | null;
  reminder_sent_at: string | null;
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

export type LeadStatus = "new" | "converted" | "archived";

export interface Lead {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  note: string | null;
  status: LeadStatus;
  converted_client_id: string | null;
  created_at: string;
}

export interface LeadAssessmentRequest {
  id: string;
  lead_id: string;
  preferred_date: string;
  preferred_time: string | null;
  note: string | null;
  status: RequestStatus;
  created_at: string;
}

export type MedicalClearance = "have_clearance" | "in_progress" | "not_needed";
export type NutritionRelationship =
  | "comfortable"
  | "complicated"
  | "actively_working"
  | "rather_not_say";

export interface LeadIntake {
  id: string;
  lead_id: string;
  date_of_birth: string | null;
  why_here: string | null;
  why_worthwhile: string | null;
  fall_past_year: boolean;
  near_fall: boolean;
  fear_of_falling: boolean;
  balance_notes: string | null;
  osteoporosis: boolean;
  joint_replacement: boolean;
  arthritis: boolean;
  bones_notes: string | null;
  medications: string | null;
  doctor_name: string | null;
  medical_clearance: MedicalClearance | null;
  lives_alone: boolean;
  drives_self: boolean;
  stairs_daily: boolean;
  day_to_day_notes: string | null;
  pain_location: string | null;
  pain_duration: string | null;
  pain_better: string | null;
  pain_worse: string | null;
  pain_type: string[] | null;
  energy_scale: number | null;
  sleep_scale: number | null;
  stress_scale: number | null;
  confidence_scale: number | null;
  nutrition_relationship: NutritionRelationship | null;
  nutrition_notes: string | null;
  support_system: string | null;
  competing_demands: string | null;
  submitted_at: string | null;
  created_at: string;
}

export type MovementName =
  | "squat"
  | "deadlift_hinge"
  | "lunge"
  | "push_up"
  | "plank"
  | "row";
export type MovementPlan = "regress" | "maintain" | "progress";

export interface LeadMovementScreening {
  id: string;
  lead_id: string;
  date: string;
  modifications_observations: string | null;
  coach_notes: string | null;
  created_at: string;
}

export interface LeadMovementScreeningResult {
  id: string;
  screening_id: string;
  movement: MovementName;
  score: number | null;
  pain: boolean;
  plan: MovementPlan | null;
  notes: string | null;
}
