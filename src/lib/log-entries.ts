import type { Activity, TrainingSession } from "@/lib/types";

export type LogEntryKind = "coached" | "solo" | "activity";

export interface LogEntry {
  id: string;
  date: string;
  kind: LogEntryKind;
  loggedBy: "coach" | "client";
  session: TrainingSession | null;
  activity: Activity | null;
}

export const LOG_ENTRY_KIND_LABEL: Record<LogEntryKind, string> = {
  coached: "Coached session",
  solo: "Solo workout",
  activity: "Activity",
};

// rose = you were there, teal = they did the prescribed plan alone,
// gold = something else active outside the plan entirely.
export const LOG_ENTRY_KIND_TONE: Record<LogEntryKind, "rose" | "teal" | "gold"> = {
  coached: "rose",
  solo: "teal",
  activity: "gold",
};

export function mergeLogEntries(
  sessions: TrainingSession[],
  activities: Activity[]
): LogEntry[] {
  const fromSessions: LogEntry[] = sessions.map((s) => ({
    id: s.id,
    date: s.date,
    kind: s.coached ? "coached" : "solo",
    loggedBy: s.logged_by,
    session: s,
    activity: null,
  }));
  const fromActivities: LogEntry[] = activities.map((a) => ({
    id: a.id,
    date: a.date,
    kind: "activity",
    loggedBy: a.logged_by,
    session: null,
    activity: a,
  }));
  return [...fromSessions, ...fromActivities].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
}
