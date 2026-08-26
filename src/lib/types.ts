export type Role = "coach" | "client" | "lead";

export interface Profile {
  id: string;
  role: Role;
  created_at: string;
}

export type PaymentSchedule = "pay_as_you_go" | "monthly";

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
  days_per_week: number | null;
  session_mode: "in_person" | "virtual" | null;
  video_sessions_enabled: boolean;
  last_inactivity_nudge_sent_at: string | null;
  preferred_name: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  physician_name: string | null;
  physician_phone: string | null;
  start_date: string | null;
  payment_schedule: PaymentSchedule | null;
  primary_goal: string | null;
  secondary_goal: string | null;
  key_health_notes: string | null;
  profile_completed_at: string | null;
  last_document_nudge_sent_at: string | null;
  last_service_checkin_nudge_sent_at: string | null;
  archived_at: string | null;
  symptom_tracker_enabled: boolean;
  last_viewed_at: string | null;
  timezone: string;
  hold_started_at: string | null;
  program_last_updated_at: string | null;
  late_cancel_free_remaining: number | null;
  pro_bono: boolean;
  pro_bono_rate: number | null;
  calorie_goal_enabled: boolean;
  daily_calorie_goal: number | null;
}

export interface SessionEntry {
  exercise: string;
  sets: string;
  reps: string;
  weight: string;
  // Present only on entries logged from the client's own program page --
  // ties the free-text entry back to the actual prescribed movement (and
  // whichever swap was active, if any) instead of just a typed name.
  exercise_id?: string;
  substitute_exercise_id?: string | null;
  // Only set (and only differs from `exercise`) when substitute_exercise_id
  // is set -- the name of the movement actually prescribed at log time.
  prescribed_exercise?: string;
  notes?: string;
  // Storage object path in the private "form-checks" bucket, e.g.
  // "{client_id}/{uuid}-{filename}" -- not a URL. Generate a short-lived
  // signed URL when actually displaying it.
  media_path?: string | null;
}

export type SessionType =
  | "program"
  | "freestyle"
  | "conversation"
  | "recovery"
  | "assessment";

export interface BodyMapMarker {
  regionId: number;
  level: number;
  label: string;
}

export interface TrainingSession {
  id: string;
  client_id: string;
  day_label: string;
  date: string;
  entries: SessionEntry[];
  rating: number | null;
  day_notes: string | null;
  logged_by: "coach" | "client";
  session_type: SessionType;
  body_map: BodyMapMarker[] | null;
  payment_status: "paid" | "unpaid" | "waived" | null;
  coached: boolean;
  coach_notes: string | null;
  created_at: string;
}

export interface ClientNote {
  id: string;
  client_id: string;
  note: string;
  created_at: string;
}

export interface BusinessSettings {
  id: true;
  cash_app_cashtag: string | null;
  zelle_info: string | null;
  cash_note: string | null;
  google_meet_link: string | null;
  updated_at: string;
}

export interface BusinessFinanceSettings {
  id: true;
  estimated_tax_rate: number | null;
  updated_at: string;
}

export interface ClientMilestone {
  id: string;
  client_id: string;
  title: string;
  notes: string | null;
  target_date: string | null;
  achieved_at: string | null;
  achieved_note: string | null;
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
  logged_by: "coach" | "client";
  coach_notes: string | null;
  photo_path: string | null;
  created_at: string;
}

export type RequestStatus = "pending" | "confirmed" | "declined" | "countered";

export type RequestType = "session" | "checkin_call" | "video_session";

export interface SessionRequest {
  id: string;
  client_id: string;
  preferred_date: string;
  preferred_time: string | null;
  note: string | null;
  status: RequestStatus;
  reschedule_from_date: string | null;
  request_type: RequestType;
  countered_date: string | null;
  countered_time: string | null;
  duration_minutes: number;
  created_at: string;
}

export type Phase = "1" | "2" | "3" | "4";

export interface CareProfile {
  id: string;
  name: string;
  description: string | null;
  client_label: string | null;
  created_at: string;
}

export interface CareProfilePacket {
  id: string;
  care_profile_id: string;
  phase: Phase;
  storage_path: string;
  created_at: string;
}

export type MuscleGroup =
  | "Glutes"
  | "Hamstrings"
  | "Quads"
  | "Calves"
  | "Adductors"
  | "Abductors"
  | "Back"
  | "Chest"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Core"
  | "Full Body"
  | "Balance/Mobility";

export type MovementType = "compound" | "accessory" | "mobility";
export type Laterality = "bilateral" | "per_arm" | "per_leg" | "per_side";

export interface Exercise {
  id: string;
  name: string;
  client_description: string | null;
  coach_cues: string | null;
  regress_to_id: string | null;
  progress_to_id: string | null;
  primary_muscle_group: MuscleGroup | null;
  movement_type: MovementType | null;
  laterality: Laterality | null;
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
  tempo: string | null;
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
  tempo_override: string | null;
  removed: boolean;
  position_override: number | null;
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
  testimonial_consent: boolean;
  created_at: string;
}

export type ProgressPhotoAngle = "front" | "side" | "back" | "other";

export interface ClientProgressPhoto {
  id: string;
  client_id: string;
  date: string;
  angle: ProgressPhotoAngle | null;
  photo_path: string;
  notes: string | null;
  created_at: string;
}

export interface ClientHabit {
  id: string;
  client_id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface ClientHabitLog {
  id: string;
  habit_id: string;
  client_id: string;
  log_date: string;
  level: number;
  created_at: string;
}

export interface ClientSymptomLog {
  id: string;
  client_id: string;
  log_date: string;
  symptom: string;
  severity: number | null;
  notes: string | null;
  shared_with_coach: boolean;
  created_at: string;
}

export interface ClientNutritionLog {
  id: string;
  client_id: string;
  log_date: string;
  meal_label: string | null;
  description: string | null;
  hunger_before: number | null;
  fullness_after: number | null;
  satisfaction: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  notes: string | null;
  photo_path: string | null;
  created_at: string;
}

export interface ClientSchedule {
  id: string;
  client_id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  time_of_day: string;
  duration_minutes: number;
  label: string | null;
  active: boolean;
  created_at: string;
}

export type PaymentKind = "session" | "late_cancellation_fee" | "retainer";

export interface Payment {
  id: string;
  client_id: string;
  description: string;
  amount: number;
  due_date: string;
  paid_on: string | null;
  reminder_sent_at: string | null;
  kind: PaymentKind;
  session_occurrence_id: string | null;
  request_id: string | null;
  created_at: string;
}

export type OccurrenceStatus =
  | "scheduled"
  | "completed"
  | "rescheduled"
  | "cancelled"
  | "late_cancelled";

export interface SessionOccurrence {
  id: string;
  client_id: string;
  client_schedule_id: string | null;
  occurrence_date: string;
  status: OccurrenceStatus;
  rescheduled_to_date: string | null;
  notes: string | null;
  reminder_sent_at: string | null;
  cancelled_by: "coach" | "client" | null;
  is_video_session: boolean;
  duration_minutes: number;
  created_at: string;
}

export interface CoachAvailability {
  id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface CoachBlockedDate {
  id: string;
  blocked_date: string;
  // Both null = the whole day is blocked. Both set = only that window
  // within the day is blocked.
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
}

export type LegalDocumentKey =
  | "contract"
  | "onboarding_form"
  | "disclaimer"
  | "minor_consent"
  | "community_agreement"
  | "monthly_plan_terms"
  | "payg_plan_terms";

export interface LegalDocument {
  id: string;
  key: LegalDocumentKey;
  title: string;
  body: string;
  version: number;
  requires_signature: boolean;
  assigned_to_all: boolean;
  updated_at: string;
}

export interface ClientDocumentAssignment {
  id: string;
  client_id: string;
  document_id: string;
  assigned_at: string;
}

export interface ClientMinorConsent {
  id: string;
  client_id: string;
  minor_full_name: string | null;
  minor_date_of_birth: string | null;
  minor_age: number | null;
  minor_grade: string | null;
  minor_sports: string | null;
  guardian_full_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  guardian_relationship: string | null;
  guardian_update_preference: "text" | "email" | "in_person" | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  physician_name: string | null;
  physician_phone: string | null;
  diagnosis_treatment: string | null;
  other_conditions_meds_allergies: string | null;
  athletic_training_clearance: string | null;
  guardian_signature_name: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientDocumentAcknowledgment {
  id: string;
  client_id: string;
  document_id: string;
  document_version: number;
  signed_name: string | null;
  acknowledged_at: string;
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
  preferred_name: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  physician_name: string | null;
  physician_phone: string | null;
  profile_completed_at: string | null;
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

export interface LeadPacketRequest {
  id: string;
  lead_id: string;
  care_profile_id: string;
  status: "pending" | "paid_and_sent";
  paid_at: string | null;
  note: string | null;
  created_at: string;
}

export type MedicalClearance = "have_clearance" | "in_progress" | "not_needed";
export type NutritionRelationship =
  | "comfortable"
  | "complicated"
  | "actively_working"
  | "rather_not_say";
export type FitnessLevel =
  | "complete_beginner"
  | "some_experience"
  | "moderately_active"
  | "previously_very_active"
  | "athlete_competitive";
export type DietHistory =
  | "never"
  | "once_or_twice"
  | "many_times"
  | "currently_on_one";
export type CoachingStyle =
  | "lots_of_encouragement"
  | "push_me_challenge_me"
  | "quiet_and_focused"
  | "flexible_read_my_mood";
export type FeedbackStyle =
  | "direct_and_honest"
  | "mix_of_both"
  | "gentle_and_encouraging"
  | "mostly_positive_correct_big_issues";
export type ContactMethod = "text" | "email" | "call" | "reach_out_if_needed";
export type CheckinFrequency =
  | "weekly"
  | "every_session_only"
  | "only_if_i_reach_out"
  | "not_at_all_session_time_only";
export type AccountabilityStyle =
  | "regular_checkins_from_mickey"
  | "tracking_own_progress"
  | "scheduled_sessions_enough"
  | "friendly_reminders_nudges";
export type ReferralSource =
  | "friend_family"
  | "social_media"
  | "flyer"
  | "google"
  | "other";

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
  hypermobility: boolean;
  pots_dysautonomia: boolean;
  mcas: boolean;
  autoimmune_condition: boolean;
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
  fitness_level: FitnessLevel | null;
  body_satisfaction_scale: number | null;
  strong_areas: string | null;
  injuries_limitations: string | null;
  heart_condition: boolean;
  high_blood_pressure: boolean;
  diabetes: boolean;
  thyroid_condition: boolean;
  joint_issues: boolean;
  asthma: boolean;
  anxiety_depression: boolean;
  eating_disorder_history: boolean;
  pregnancy_postpartum: boolean;
  goal_change_description: string | null;
  goal_success_3_months: string | null;
  goal_held_back_before: string | null;
  goal_importance_scale: number | null;
  confidence_to_change_scale: number | null;
  foods_loved: string | null;
  foods_scary: string | null;
  diet_history: DietHistory | null;
  food_stress_scale: number | null;
  average_sleep_hours: string | null;
  sleep_duration_pattern: string | null;
  stress_sources: string | null;
  stress_coping: string | null;
  coaching_style: CoachingStyle | null;
  feedback_style: FeedbackStyle | null;
  contact_method: ContactMethod | null;
  checkin_frequency: CheckinFrequency | null;
  accountability_style: AccountabilityStyle | null;
  past_coach_what_didnt_work: string | null;
  anything_else: string | null;
  referral_source: ReferralSource | null;
  submitted_at: string | null;
  created_at: string;
}

export interface ClientIntake {
  id: string;
  client_id: string;
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
  hypermobility: boolean;
  pots_dysautonomia: boolean;
  mcas: boolean;
  autoimmune_condition: boolean;
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
  fitness_level: FitnessLevel | null;
  body_satisfaction_scale: number | null;
  strong_areas: string | null;
  injuries_limitations: string | null;
  heart_condition: boolean;
  high_blood_pressure: boolean;
  diabetes: boolean;
  thyroid_condition: boolean;
  joint_issues: boolean;
  asthma: boolean;
  anxiety_depression: boolean;
  eating_disorder_history: boolean;
  pregnancy_postpartum: boolean;
  goal_change_description: string | null;
  goal_success_3_months: string | null;
  goal_held_back_before: string | null;
  goal_importance_scale: number | null;
  confidence_to_change_scale: number | null;
  foods_loved: string | null;
  foods_scary: string | null;
  diet_history: DietHistory | null;
  food_stress_scale: number | null;
  average_sleep_hours: string | null;
  sleep_duration_pattern: string | null;
  stress_sources: string | null;
  stress_coping: string | null;
  coaching_style: CoachingStyle | null;
  feedback_style: FeedbackStyle | null;
  contact_method: ContactMethod | null;
  checkin_frequency: CheckinFrequency | null;
  accountability_style: AccountabilityStyle | null;
  past_coach_what_didnt_work: string | null;
  anything_else: string | null;
  referral_source: ReferralSource | null;
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

export type CommunityPostKind = "win" | "question" | "progress" | "general";

export interface CommunityPost {
  id: string;
  client_id: string;
  kind: CommunityPostKind;
  body: string | null;
  photo_path: string | null;
  created_at: string;
}

export interface CommunityPostComment {
  id: string;
  post_id: string;
  client_id: string | null;
  author_role: "client" | "coach";
  body: string;
  created_at: string;
}

export interface CommunityPostReaction {
  id: string;
  post_id: string;
  client_id: string;
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
