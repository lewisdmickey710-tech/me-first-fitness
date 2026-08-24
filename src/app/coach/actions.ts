"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextPhase, getCurrentPhase } from "@/lib/phase";
import {
  sendMilestoneAchievedEmail,
  sendCoachCancelledSessionEmail,
  sendDayBlockedEmail,
} from "@/lib/email";
import { DAY_NAMES, formatTimeOfDay } from "@/lib/schedule";
import { nowInBusinessTz, toDateString } from "@/lib/timezone";
import { RETAINER_FEE_PER_WEEK } from "@/lib/retainer";
import type { BodyMapMarker, RequestStatus, SessionEntry, SessionType } from "@/lib/types";

export async function addClient(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const care_profile_id = String(formData.get("care_profile_id") ?? "");
  const days_per_week = String(formData.get("days_per_week") ?? "");
  const session_mode = String(formData.get("session_mode") ?? "");
  const sessionsAllottedRaw = String(formData.get("sessions_allotted") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || !care_profile_id) {
    throw new Error("Name and care profile are required.");
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      care_profile_id,
      days_per_week: days_per_week ? Number(days_per_week) : null,
      session_mode: session_mode || null,
      sessions_allotted: sessionsAllottedRaw
        ? Number(sessionsAllottedRaw)
        : null,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const { error: phaseError } = await supabase
    .from("client_phase_history")
    .insert({
      client_id: data.id,
      cycle_number: 1,
      phase: "1",
      started_on: new Date().toISOString().slice(0, 10),
      planned_weeks: 4,
    });

  if (phaseError) throw new Error(phaseError.message);

  revalidatePath("/coach/roster");
  redirect(`/coach/clients/${data.id}`);
}

export async function advancePhase(clientId: string) {
  const supabase = await createClient();

  const current = await getCurrentPhase(supabase, clientId);
  if (!current) throw new Error("This client has no active phase to advance.");

  const today = new Date().toISOString().slice(0, 10);

  const { error: endError } = await supabase
    .from("client_phase_history")
    .update({ ended_on: today })
    .eq("id", current.id);

  if (endError) throw new Error(endError.message);

  const advancingToNewCycle = current.phase === "4";
  const upcoming = nextPhase(current.phase);

  const { error: startError } = await supabase
    .from("client_phase_history")
    .insert({
      client_id: clientId,
      cycle_number: advancingToNewCycle
        ? current.cycle_number + 1
        : current.cycle_number,
      phase: upcoming,
      started_on: today,
      planned_weeks: 4,
    });

  if (startError) throw new Error(startError.message);

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath("/coach/roster");
}

export async function setRequestStatus(
  requestId: string,
  clientId: string,
  status: RequestStatus
) {
  const supabase = await createClient();

  const { data: request, error } = await supabase
    .from("requests")
    .update({ status })
    .eq("id", requestId)
    .select("preferred_date, preferred_time, reschedule_from_date, request_type")
    .single();

  if (error) throw new Error(error.message);

  if (status === "confirmed" && request) {
    // Confirming a reschedule request (one tied to a specific existing
    // session, not a freeform new-time request) closes the loop
    // automatically -- the original date's attendance record is marked
    // rescheduled instead of being left to drift out of sync.
    if (request.reschedule_from_date) {
      const { error: occurrenceError } = await supabase
        .from("session_occurrences")
        .upsert(
          {
            client_id: clientId,
            occurrence_date: request.reschedule_from_date,
            status: "rescheduled",
            rescheduled_to_date: request.preferred_date,
          },
          { onConflict: "client_id,occurrence_date" }
        );
      if (occurrenceError) throw new Error(occurrenceError.message);
    }

    // Confirming used to only flip this status flag with nothing else
    // reflecting it anywhere -- this is what actually puts the confirmed
    // date on the calendar (both the coach's aggregate schedule and the
    // client's own), as a real one-off session rather than a change to
    // their standing recurring weekly time.
    const { error: scheduleError } = await supabase
      .from("session_occurrences")
      .upsert(
        {
          client_id: clientId,
          occurrence_date: request.preferred_date,
          status: "scheduled",
          notes: request.preferred_time
            ? `Confirmed request — ${request.preferred_time}`
            : "Confirmed request",
          is_video_session: request.request_type === "video_session",
        },
        { onConflict: "client_id,occurrence_date" }
      );
    if (scheduleError) throw new Error(scheduleError.message);
  }

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath("/coach/roster");
  revalidatePath("/coach/schedule");
  revalidatePath("/client/schedule");
  revalidatePath("/client/dashboard");
}

// A video session request's timeslot is only meant to be confirmed once
// its linked payment balance is actually paid -- this just runs the two
// existing actions together so the coach does it in one motion instead of
// two separate ones that could be done out of order.
export async function confirmVideoSessionRequest(
  requestId: string,
  clientId: string,
  paymentId: string
) {
  await markPaymentPaid(paymentId, clientId);
  await setRequestStatus(requestId, clientId, "confirmed");
}

export async function logSession(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const day_label = String(formData.get("day_label") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const ratingRaw = String(formData.get("rating") ?? "");
  const day_notes = String(formData.get("day_notes") ?? "").trim();
  const sessionTypeRaw = String(formData.get("session_type") ?? "freestyle");
  const session_type = (
    ["program", "freestyle", "conversation", "recovery", "assessment"].includes(
      sessionTypeRaw
    )
      ? sessionTypeRaw
      : "freestyle"
  ) as SessionType;
  const bodyMapRaw = String(formData.get("body_map") ?? "");
  let body_map: BodyMapMarker[] | null = null;
  if (bodyMapRaw) {
    try {
      const parsed = JSON.parse(bodyMapRaw);
      if (Array.isArray(parsed) && parsed.length > 0) body_map = parsed;
    } catch {
      // ignore malformed body map JSON rather than blocking the session save
    }
  }

  const exercises = formData.getAll("exercise") as string[];
  const sets = formData.getAll("sets") as string[];
  const reps = formData.getAll("reps") as string[];
  const weights = formData.getAll("weight") as string[];

  const entries: SessionEntry[] = exercises
    .map((exercise, i) => ({
      exercise: exercise?.trim() ?? "",
      sets: sets[i] ?? "",
      reps: reps[i] ?? "",
      weight: weights[i] ?? "",
    }))
    .filter((e) => e.exercise.length > 0);

  if (!day_label || !date) {
    throw new Error("Day label and date are required.");
  }

  const paymentStatusRaw = String(formData.get("payment_status") ?? "");
  const payment_status = (
    ["paid", "unpaid", "waived"].includes(paymentStatusRaw) ? paymentStatusRaw : null
  ) as "paid" | "unpaid" | "waived" | null;

  const { error } = await supabase.from("sessions").insert({
    client_id: clientId,
    day_label,
    date,
    entries,
    rating: ratingRaw ? Number(ratingRaw) : null,
    day_notes: day_notes || null,
    logged_by: "coach",
    session_type,
    body_map,
    payment_status,
  });

  if (error) throw new Error(error.message);

  // A logged session means that date's occurrence was attended -- record
  // it as completed (overwriting any prior status for that date, since an
  // actual logged session is the strongest signal available).
  await supabase.from("session_occurrences").upsert(
    { client_id: clientId, occurrence_date: date, status: "completed" },
    { onConflict: "client_id,occurrence_date" }
  );

  revalidatePath(`/coach/clients/${clientId}`);
  redirect(`/coach/clients/${clientId}?tab=sessions`);
}

// Per-client edits to a prescribed exercise (swap it, change sets/reps, or
// drop it entirely) without touching the shared care-profile template
// everyone else on that track follows. One row per client + exercise slot
// (client_program_overrides_client_slot_unique), so this is always an
// upsert -- re-saving with everything blank/unchecked clears the override
// back to the prescribed default.
export async function setClientProgramOverride(
  clientId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const program_day_exercise_id = String(
    formData.get("program_day_exercise_id") ?? ""
  );
  if (!program_day_exercise_id) throw new Error("Missing exercise.");

  const substitute_exercise_id =
    String(formData.get("substitute_exercise_id") ?? "").trim() || null;
  const sets_override = String(formData.get("sets_override") ?? "").trim() || null;
  const reps_override = String(formData.get("reps_override") ?? "").trim() || null;
  const tempo_override = String(formData.get("tempo_override") ?? "").trim() || null;
  const removed = formData.get("removed") === "on";

  const { error } = await supabase.from("client_program_overrides").upsert(
    {
      client_id: clientId,
      program_day_exercise_id,
      substitute_exercise_id,
      sets_override,
      reps_override,
      tempo_override,
      removed,
      edited_by: "coach",
      active: true,
    },
    { onConflict: "client_id,program_day_exercise_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath(`/coach/clients/${clientId}/log-session`);
}

// Persists a full drag-and-drop reorder of one client's program day --
// called directly from the client-side drag component (not a <form>), so
// this takes the new order as a plain array rather than FormData. Every
// exercise in the day gets an explicit position_override (its index in
// the new order), which is simpler and less error-prone than trying to
// diff against whatever positions were previously set.
export async function reorderClientProgramDay(
  clientId: string,
  pdeIdsInOrder: string[]
) {
  const supabase = await createClient();

  const rows = pdeIdsInOrder.map((program_day_exercise_id, index) => ({
    client_id: clientId,
    program_day_exercise_id,
    position_override: index,
    edited_by: "coach" as const,
  }));

  const { error } = await supabase
    .from("client_program_overrides")
    .upsert(rows, { onConflict: "client_id,program_day_exercise_id" });

  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath(`/coach/clients/${clientId}/log-session`);
}

export async function logSessionOccurrence(
  clientId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const occurrence_date = String(formData.get("occurrence_date") ?? "");
  const status = String(formData.get("status") ?? "");
  const client_schedule_id = String(formData.get("client_schedule_id") ?? "") || null;
  const rescheduled_to_date = String(formData.get("rescheduled_to_date") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!occurrence_date || !status) {
    throw new Error("Date and status are required.");
  }
  if (!["completed", "rescheduled", "cancelled", "late_cancelled"].includes(status)) {
    throw new Error("Invalid status.");
  }

  const { error } = await supabase.from("session_occurrences").upsert(
    {
      client_id: clientId,
      client_schedule_id,
      occurrence_date,
      status,
      rescheduled_to_date,
      notes,
    },
    { onConflict: "client_id,occurrence_date" }
  );

  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
}

const MEASUREMENT_FIELDS = [
  "weight",
  "neck",
  "chest",
  "waist",
  "hips",
  "thigh_l",
  "thigh_r",
  "bicep_l",
  "bicep_r",
] as const;

export async function logMeasurementAsCoach(
  clientId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const date = String(formData.get("date") ?? "");
  if (!date) throw new Error("Date is required.");

  const values: Record<string, number | null> = {};
  for (const field of MEASUREMENT_FIELDS) {
    const raw = String(formData.get(field) ?? "").trim();
    values[field] = raw ? Number(raw) : null;
  }
  const notes = String(formData.get("notes") ?? "").trim();

  const { error } = await supabase.from("measurements").insert({
    client_id: clientId,
    date,
    ...values,
    notes: notes || null,
    logged_by: "coach",
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
  redirect(`/coach/clients/${clientId}?tab=measurements`);
}

export async function logCheckinAsCoach(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const date = String(formData.get("date") ?? "");
  const sleep = String(formData.get("sleep") ?? "").trim();
  const water = String(formData.get("water") ?? "").trim();
  const food = String(formData.get("food") ?? "").trim();
  const energy = String(formData.get("energy") ?? "").trim();
  const mood = String(formData.get("mood") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!date) throw new Error("Date is required.");

  const { error } = await supabase.from("checkins").insert({
    client_id: clientId,
    date,
    sleep: sleep || null,
    water: water || null,
    food: food || null,
    energy: energy || null,
    mood: mood || null,
    notes: notes || null,
    logged_by: "coach",
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
  redirect(`/coach/clients/${clientId}?tab=checkins`);
}

export async function addClientSchedule(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const dayOfWeek = String(formData.get("day_of_week") ?? "");
  const timeOfDay = String(formData.get("time_of_day") ?? "");
  const label = String(formData.get("label") ?? "").trim();

  if (dayOfWeek === "" || !timeOfDay) {
    throw new Error("Day and time are required.");
  }

  const { error } = await supabase.from("client_schedules").insert({
    client_id: clientId,
    day_of_week: Number(dayOfWeek),
    time_of_day: timeOfDay,
    label: label || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}/schedule`);
  revalidatePath(`/coach/clients/${clientId}`);
}

export async function removeClientSchedule(
  scheduleId: string,
  clientId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("client_schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}/schedule`);
  revalidatePath(`/coach/clients/${clientId}`);
}

export async function updatePaymentMethods(formData: FormData) {
  const supabase = await createClient();

  const textOrNull = (name: string) => {
    const v = String(formData.get(name) ?? "").trim();
    return v || null;
  };

  const { error } = await supabase
    .from("business_settings")
    .update({
      cash_app_cashtag: textOrNull("cash_app_cashtag"),
      zelle_info: textOrNull("zelle_info"),
      cash_note: textOrNull("cash_note"),
      google_meet_link: textOrNull("google_meet_link"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) throw new Error(error.message);

  revalidatePath("/coach/settings");
  revalidatePath("/client/dashboard");
  revalidatePath("/client/schedule");
}

export async function addPayment(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const description = String(formData.get("description") ?? "").trim();
  const amount = String(formData.get("amount") ?? "");
  const dueDate = String(formData.get("due_date") ?? "");

  if (!description || !amount || !dueDate) {
    throw new Error("Description, amount, and due date are required.");
  }

  const { error } = await supabase.from("payments").insert({
    client_id: clientId,
    description,
    amount: Number(amount),
    due_date: dueDate,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
  redirect(`/coach/clients/${clientId}?tab=payments`);
}

export async function markPaymentPaid(paymentId: string, clientId: string) {
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from("payments")
    .update({ paid_on: today })
    .eq("id", paymentId);

  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
}

export async function updateLegalDocument(
  documentId: string,
  currentVersion: number,
  formData: FormData
) {
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const requiresSignature = formData.get("requires_signature") === "on";

  if (!title || !body) {
    throw new Error("Title and body are required.");
  }

  // Bumping the version means every client's existing acknowledgment (tied
  // to the version they signed) no longer covers this text -- they'll be
  // asked to review and re-acknowledge next time they visit.
  const { error } = await supabase
    .from("legal_documents")
    .update({
      title,
      body,
      requires_signature: requiresSignature,
      version: currentVersion + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  if (error) throw new Error(error.message);

  revalidatePath("/coach/documents");
}

export async function setClientDocumentAssignment(
  clientId: string,
  documentId: string,
  assigned: boolean
) {
  const supabase = await createClient();

  if (assigned) {
    const { error } = await supabase
      .from("client_document_assignments")
      .upsert(
        { client_id: clientId, document_id: documentId },
        { onConflict: "client_id,document_id" }
      );
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("client_document_assignments")
      .delete()
      .eq("client_id", clientId)
      .eq("document_id", documentId);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath("/client/documents");
}

export async function addClientForAccount(userId: string, formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const care_profile_id = String(formData.get("care_profile_id") ?? "");
  const days_per_week = String(formData.get("days_per_week") ?? "");
  const session_mode = String(formData.get("session_mode") ?? "");
  const sessionsAllottedRaw = String(formData.get("sessions_allotted") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || !care_profile_id) {
    throw new Error("Name and care profile are required.");
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      user_id: userId,
      care_profile_id,
      days_per_week: days_per_week ? Number(days_per_week) : null,
      session_mode: session_mode || null,
      sessions_allotted: sessionsAllottedRaw
        ? Number(sessionsAllottedRaw)
        : null,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const { error: phaseError } = await supabase
    .from("client_phase_history")
    .insert({
      client_id: data.id,
      cycle_number: 1,
      phase: "1",
      started_on: new Date().toISOString().slice(0, 10),
      planned_weeks: 4,
    });

  if (phaseError) throw new Error(phaseError.message);

  revalidatePath("/coach/signups");
  revalidatePath("/coach/roster");
  redirect(`/coach/clients/${data.id}`);
}

export async function linkExistingClientToAccount(
  userId: string,
  clientId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({ user_id: userId })
    .eq("id", clientId);

  if (error) throw new Error(error.message);

  revalidatePath("/coach/signups");
  revalidatePath("/coach/roster");
  revalidatePath(`/coach/clients/${clientId}`);
}

// Rejects a pending signup that isn't a real client -- test accounts,
// someone who signed up by mistake, etc. Deletes the actual login (auth
// user), which cascades to their profiles row, so it stops showing up on
// Signups entirely rather than just being hidden. Doesn't touch any
// `clients` row, since a pending signup by definition has none yet.
export async function rejectSignup(userId: string) {
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) throw new Error(error.message);

  revalidatePath("/coach/signups");
}

export async function updateClientProfile(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const textOrNull = (name: string) => {
    const v = String(formData.get(name) ?? "").trim();
    return v || null;
  };

  const payment_schedule = String(formData.get("payment_schedule") ?? "");
  const session_mode = String(formData.get("session_mode") ?? "");
  const care_profile_id = String(formData.get("care_profile_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();

  const { error } = await supabase
    .from("clients")
    .update({
      ...(name ? { name } : {}),
      ...(care_profile_id ? { care_profile_id } : {}),
      ...(timezone ? { timezone } : {}),
      preferred_name: textOrNull("preferred_name"),
      date_of_birth: textOrNull("date_of_birth"),
      phone: textOrNull("phone"),
      email: textOrNull("email"),
      emergency_contact_name: textOrNull("emergency_contact_name"),
      emergency_contact_phone: textOrNull("emergency_contact_phone"),
      physician_name: textOrNull("physician_name"),
      physician_phone: textOrNull("physician_phone"),
      start_date: textOrNull("start_date"),
      payment_schedule: payment_schedule || null,
      session_mode: session_mode || null,
      video_sessions_enabled: formData.get("video_sessions_enabled") === "on",
      primary_goal: textOrNull("primary_goal"),
      secondary_goal: textOrNull("secondary_goal"),
      key_health_notes: textOrNull("key_health_notes"),
      symptom_tracker_enabled: formData.get("symptom_tracker_enabled") === "on",
    })
    .eq("id", clientId);

  if (error) throw new Error(error.message);

  // Bootstraps phase tracking for a client who never got a starting
  // client_phase_history row -- normally created automatically when a
  // client is first added, but a legacy client (predating the care
  // profile/phase system) or one added without a care profile never got
  // one, and without it their program page has no phase to pull days
  // from even once a care profile is set.
  if (care_profile_id) {
    const { data: existingPhase } = await supabase
      .from("client_phase_history")
      .select("id")
      .eq("client_id", clientId)
      .limit(1)
      .maybeSingle();

    if (!existingPhase) {
      const { error: phaseError } = await supabase
        .from("client_phase_history")
        .insert({
          client_id: clientId,
          cycle_number: 1,
          phase: "1",
          started_on: new Date().toISOString().slice(0, 10),
          planned_weeks: 4,
        });
      if (phaseError) throw new Error(phaseError.message);
    }
  }

  revalidatePath(`/coach/clients/${clientId}`);
}

// Puts a client's membership on hold: no standing sessions, but a flat
// weekly retainer keeps their app access and reserves their spot. Creates
// the first week's retainer payment immediately -- the daily cron rolls
// subsequent weeks forward for as long as hold_started_at stays set (see
// src/app/api/cron/reminders/route.ts).
export async function startClientHold(clientId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({ hold_started_at: new Date().toISOString() })
    .eq("id", clientId);
  if (error) throw new Error(error.message);

  const { error: paymentError } = await supabase.from("payments").insert({
    client_id: clientId,
    description: "Weekly hold retainer",
    amount: RETAINER_FEE_PER_WEEK,
    due_date: toDateString(nowInBusinessTz()),
    kind: "retainer",
  });
  if (paymentError) throw new Error(paymentError.message);

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath("/coach/roster");
}

export async function endClientHold(clientId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({ hold_started_at: null })
    .eq("id", clientId);
  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath("/coach/roster");
}

// Marks "today" as when a virtual-async client's program was last updated,
// so their dashboard can show something concrete in place of a
// next-session card. Deliberately a manual button rather than something
// wired into every program-override mutation -- keeps the signal
// intentional (Mickey confirming she actually updated it for the
// week/cycle) rather than firing on every minor tweak.
export async function touchProgramUpdated(clientId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({ program_last_updated_at: new Date().toISOString() })
    .eq("id", clientId);
  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
}

export async function archiveClient(clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", clientId);
  if (error) throw new Error(error.message);

  revalidatePath("/coach/roster");
  redirect("/coach/roster");
}

export async function unarchiveClient(clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ archived_at: null })
    .eq("id", clientId);
  if (error) throw new Error(error.message);

  revalidatePath("/coach/roster");
}

export async function addClientNote(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return;

  const { error } = await supabase
    .from("client_notes")
    .insert({ client_id: clientId, note });
  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
}

export async function deleteClientNote(clientId: string, noteId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("client_notes")
    .delete()
    .eq("id", noteId);
  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
}

export async function addHabitForClient(clientId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_habits")
    .insert({ client_id: clientId, name: trimmed });
  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
}

export async function addMilestone(clientId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Title is required.");
  const targetDate = String(formData.get("target_date") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("client_milestones").insert({
    client_id: clientId,
    title,
    target_date: targetDate,
    notes,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
}

export async function deleteMilestone(clientId: string, milestoneId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("client_milestones")
    .delete()
    .eq("id", milestoneId);
  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
}

export async function markMilestoneAchieved(
  clientId: string,
  milestoneId: string,
  formData: FormData
) {
  const achievedNote = String(formData.get("achieved_note") ?? "").trim() || null;
  const supabase = await createClient();

  const { data: milestone, error } = await supabase
    .from("client_milestones")
    .update({ achieved_at: new Date().toISOString(), achieved_note: achievedNote })
    .eq("id", milestoneId)
    .select("title")
    .single();
  if (error) throw new Error(error.message);

  // Best-effort -- a missing/unreachable login email shouldn't block marking
  // the milestone itself as achieved.
  try {
    const { data: client } = await supabase
      .from("clients")
      .select("name, user_id")
      .eq("id", clientId)
      .single();
    if (client?.user_id) {
      const admin = createAdminClient();
      const { data: userResult } = await admin.auth.admin.getUserById(client.user_id);
      if (userResult?.user?.email) {
        await sendMilestoneAchievedEmail(
          userResult.user.email,
          client.name,
          milestone.title,
          achievedNote
        );
      }
    }
  } catch (emailError) {
    console.error("Failed to send milestone email", emailError);
  }

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath("/client/milestones");
  revalidatePath("/client/dashboard");
}

export async function unmarkMilestoneAchieved(clientId: string, milestoneId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("client_milestones")
    .update({ achieved_at: null, achieved_note: null })
    .eq("id", milestoneId);
  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
}

// Best-effort bookkeeping so the Motherboard knows the coach has actually
// seen this client's latest activity -- never blocks the page if it fails.
// Must be invoked as a real action (from a Client Component, e.g. on
// mount) rather than awaited during a Server Component's render -- the
// revalidatePath call below is a no-op (or throws) otherwise, which is
// exactly why the Motherboard's document/cancellation flags used to keep
// showing after the coach had already viewed the client.
export async function touchClientViewed(clientId: string) {
  try {
    const supabase = await createClient();
    await supabase
      .from("clients")
      .update({ last_viewed_at: new Date().toISOString() })
      .eq("id", clientId);
    revalidatePath("/coach/roster");
  } catch (err) {
    console.error("Failed to record client view", err);
  }
}

// ---- Community board moderation ----

export async function addCommunityCommentAsCoach(postId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Comment can't be empty.");

  const supabase = await createClient();
  const { error } = await supabase.from("community_post_comments").insert({
    post_id: postId,
    client_id: null,
    author_role: "coach",
    body,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/coach/community");
  revalidatePath("/client/community");
}

export async function deleteCommunityPostAsCoach(postId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("community_posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);

  revalidatePath("/coach/community");
  revalidatePath("/client/community");
}

export async function deleteCommunityCommentAsCoach(commentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("community_post_comments")
    .delete()
    .eq("id", commentId);
  if (error) throw new Error(error.message);

  revalidatePath("/coach/community");
  revalidatePath("/client/community");
}

// ---- Availability & coach-initiated cancellations ----

async function clientLoginEmail(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

export async function addCoachAvailability(formData: FormData) {
  const supabase = await createClient();

  const day_of_week = Number(formData.get("day_of_week") ?? "");
  const start_time = String(formData.get("start_time") ?? "").trim();
  const end_time = String(formData.get("end_time") ?? "").trim();

  if (
    Number.isNaN(day_of_week) ||
    day_of_week < 0 ||
    day_of_week > 6 ||
    !start_time ||
    !end_time
  ) {
    throw new Error("Day, start time, and end time are required.");
  }
  if (end_time <= start_time) {
    throw new Error("End time must be after start time.");
  }

  const { error } = await supabase
    .from("coach_availability")
    .insert({ day_of_week, start_time, end_time });
  if (error) throw new Error(error.message);

  revalidatePath("/coach/availability");
}

export async function removeCoachAvailability(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("coach_availability").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/coach/availability");
}

export async function blockDate(formData: FormData) {
  const supabase = await createClient();

  const blocked_date = String(formData.get("blocked_date") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const start_time = String(formData.get("start_time") ?? "").trim() || null;
  const end_time = String(formData.get("end_time") ?? "").trim() || null;
  if (!blocked_date) throw new Error("Date is required.");
  if ((start_time && !end_time) || (!start_time && end_time)) {
    throw new Error(
      "Provide both a start and end time, or leave both blank to block the whole day."
    );
  }
  if (start_time && end_time && end_time <= start_time) {
    throw new Error("End time must be after start time.");
  }

  const isPartial = !!(start_time && end_time);

  // A whole-day block is unique per date (upsert-able); a partial
  // time-range block isn't unique -- a date can have several -- so it's
  // always a fresh insert.
  if (isPartial) {
    const { error } = await supabase
      .from("coach_blocked_dates")
      .insert({ blocked_date, reason, start_time, end_time });
    if (error) throw new Error(error.message);
  } else {
    const { data: existing } = await supabase
      .from("coach_blocked_dates")
      .select("id")
      .eq("blocked_date", blocked_date)
      .is("start_time", null)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("coach_blocked_dates")
        .update({ reason })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("coach_blocked_dates")
        .insert({ blocked_date, reason, start_time: null, end_time: null });
      if (error) throw new Error(error.message);
    }
  }

  // Auto-cancel whichever clients had a session that day -- anyone whose
  // recurring weekly time falls on this weekday (and isn't already
  // resolved for this exact date) plus anyone with a one-off confirmed
  // ("scheduled") occurrence on this exact date. When the block is
  // partial, only sessions whose time actually falls inside the blocked
  // window are cancelled -- everything else that day is untouched.
  const dayOfWeek = new Date(`${blocked_date}T00:00:00Z`).getUTCDay();
  const startNorm = start_time?.slice(0, 5) ?? null;
  const endNorm = end_time?.slice(0, 5) ?? null;
  function timeInBlockedRange(timeOfDay: string | null): boolean {
    if (!isPartial) return true;
    if (!timeOfDay) return false;
    const norm = timeOfDay.slice(0, 5);
    return norm >= startNorm! && norm < endNorm!;
  }

  const [{ data: schedules }, { data: dateOccurrences }] = await Promise.all([
    supabase
      .from("client_schedules")
      .select("client_id, time_of_day")
      .eq("day_of_week", dayOfWeek)
      .eq("active", true),
    supabase
      .from("session_occurrences")
      .select("client_id, status, notes")
      .eq("occurrence_date", blocked_date),
  ]);

  const occurrenceByClient = new Map(
    (dateOccurrences ?? []).map((o) => [o.client_id, o])
  );

  const affectedIds = new Set<string>();
  for (const s of schedules ?? []) {
    if (!timeInBlockedRange(s.time_of_day)) continue;
    const existing = occurrenceByClient.get(s.client_id);
    if (existing && existing.status !== "scheduled") continue;
    affectedIds.add(s.client_id);
  }
  for (const [clientId, o] of occurrenceByClient) {
    if (o.status !== "scheduled") continue;
    const timeMatch = o.notes?.match(/Confirmed request — (\d{2}:\d{2})/);
    if (!timeInBlockedRange(timeMatch?.[1] ?? null)) continue;
    affectedIds.add(clientId);
  }

  if (affectedIds.size > 0) {
    const { data: affectedClients } = await supabase
      .from("clients")
      .select("id, name, user_id")
      .in("id", [...affectedIds]);

    const dayName = DAY_NAMES[dayOfWeek];
    const whenText = isPartial
      ? `${dayName}, ${blocked_date} (${formatTimeOfDay(start_time!)}–${formatTimeOfDay(end_time!)})`
      : `${dayName}, ${blocked_date}`;
    for (const client of affectedClients ?? []) {
      const { error: cancelError } = await supabase.from("session_occurrences").upsert(
        {
          client_id: client.id,
          occurrence_date: blocked_date,
          status: "cancelled",
          cancelled_by: "coach",
          notes: reason
            ? `Coach blocked this time: ${reason}`
            : "Coach blocked this time.",
        },
        { onConflict: "client_id,occurrence_date" }
      );
      if (cancelError) throw new Error(cancelError.message);

      try {
        const email = await clientLoginEmail(client.user_id);
        if (email) {
          await sendDayBlockedEmail(email, client.name, whenText, reason);
        }
      } catch (emailError) {
        console.error("Failed to send day-blocked email", emailError);
      }
    }
  }

  revalidatePath("/coach/availability");
  revalidatePath("/coach/schedule");
  revalidatePath("/client/schedule");
  revalidatePath("/client/dashboard");
}

export async function unblockDate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("coach_blocked_dates").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/coach/availability");
}

// Mirrors the client's own "Cancel" button on /client/schedule, but from
// the coach's side: no late-cancellation fee logic (never applies when
// it's the coach cancelling), and an immediate email so the client has
// something in writing before Mickey follows up by text herself.
export async function coachCancelSession(
  clientId: string,
  occurrenceDate: string,
  clientScheduleId: string | null
) {
  const supabase = await createClient();

  const { error } = await supabase.from("session_occurrences").upsert(
    {
      client_id: clientId,
      ...(clientScheduleId ? { client_schedule_id: clientScheduleId } : {}),
      occurrence_date: occurrenceDate,
      status: "cancelled",
      cancelled_by: "coach",
    },
    { onConflict: "client_id,occurrence_date" }
  );
  if (error) throw new Error(error.message);

  try {
    const { data: client } = await supabase
      .from("clients")
      .select("name, user_id")
      .eq("id", clientId)
      .single();
    if (client) {
      const email = await clientLoginEmail(client.user_id);
      if (email) {
        await sendCoachCancelledSessionEmail(email, client.name, occurrenceDate);
      }
    }
  } catch (emailError) {
    console.error("Failed to send coach-cancelled session email", emailError);
  }

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath("/coach/schedule");
  revalidatePath("/client/schedule");
  revalidatePath("/client/dashboard");
}
