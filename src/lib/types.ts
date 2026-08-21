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
