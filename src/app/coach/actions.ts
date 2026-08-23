"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextPhase, getCurrentPhase } from "@/lib/phase";
import { sendMilestoneAchievedEmail } from "@/lib/email";
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
    .select("preferred_date, preferred_time, reschedule_from_date")
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
  const removed = formData.get("removed") === "on";

  const { error } = await supabase.from("client_program_overrides").upsert(
    {
      client_id: clientId,
      program_day_exercise_id,
      substitute_exercise_id,
      sets_override,
      reps_override,
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

export async function updateClientProfile(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const textOrNull = (name: string) => {
    const v = String(formData.get(name) ?? "").trim();
    return v || null;
  };

  const payment_schedule = String(formData.get("payment_schedule") ?? "");
  const care_profile_id = String(formData.get("care_profile_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  const { error } = await supabase
    .from("clients")
    .update({
      ...(name ? { name } : {}),
      ...(care_profile_id ? { care_profile_id } : {}),
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
