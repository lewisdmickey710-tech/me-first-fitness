"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextPhase, getCurrentPhase } from "@/lib/phase";
import {
  sendMilestoneAchievedEmail,
  sendCoachCancelledSessionEmail,
  sendEmergencyCancelledSessionEmail,
  sendDayBlockedEmail,
  sendRequestCounteredEmail,
  sendSessionRescheduledEmail,
  sendSessionBookedEmail,
} from "@/lib/email";
import { DAY_NAMES, formatTimeOfDay } from "@/lib/schedule";
import { nowInBusinessTz, toDateString } from "@/lib/timezone";
import { RETAINER_FEE_PER_WEEK } from "@/lib/retainer";
import { CALL_DURATION_MINUTES, VIDEO_SESSION_RATE } from "@/lib/video-session";
import { safeFileName } from "@/lib/storage";
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
    .select(
      "preferred_date, preferred_time, reschedule_from_date, request_type, duration_minutes"
    )
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
          duration_minutes: request.duration_minutes,
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

// Dragging a pending request to a different slot on the schedule grid
// proposes that time instead of just accepting or declining -- the ball
// is back in the client's court to accept it (respondToCounteredRequest,
// client/actions.ts) or send a fresh request.
export async function counterRequest(
  requestId: string,
  clientId: string,
  counteredDate: string,
  counteredTime: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("requests")
    .update({
      status: "countered",
      countered_date: counteredDate,
      countered_time: counteredTime,
    })
    .eq("id", requestId);
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
        await sendRequestCounteredEmail(
          email,
          client.name,
          `${counteredDate} at ${formatTimeOfDay(counteredTime)}`
        );
      }
    }
  } catch (emailError) {
    console.error("Failed to send request-countered email", emailError);
  }

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath("/coach/schedule");
  revalidatePath("/client/schedule");
  revalidatePath("/client/dashboard");
}

// Dragging (tapping-and-dropping) an already-booked session to a
// different slot on the schedule grid moves it. Two modes:
//  - one-time (default): a per-date exception, same mechanism
//    coachCancelSession already uses -- the client's standing recurring
//    time (client_schedules) is left untouched, only this one date moves.
//  - permanent: the client's actual standing weekly time changes. If the
//    original slot came from a client_schedules row, that row itself gets
//    moved (which automatically covers this date too, since it now
//    matches the new day-of-week); otherwise a new recurring row is
//    created starting now.
async function coachRescheduleSessionCore(
  clientId: string,
  fromDate: string,
  fromTime: string,
  toDate: string,
  toTime: string,
  durationMinutes: number,
  permanent = false
) {
  const supabase = await createClient();
  const toDayOfWeek = new Date(`${toDate}T00:00:00Z`).getUTCDay();

  if (permanent) {
    const fromDayOfWeek = new Date(`${fromDate}T00:00:00Z`).getUTCDay();
    const { data: existingSchedule } = await supabase
      .from("client_schedules")
      .select("id")
      .eq("client_id", clientId)
      .eq("day_of_week", fromDayOfWeek)
      .eq("time_of_day", fromTime)
      .eq("active", true)
      .maybeSingle();

    if (existingSchedule) {
      const { error } = await supabase
        .from("client_schedules")
        .update({
          day_of_week: toDayOfWeek,
          time_of_day: toTime,
          duration_minutes: durationMinutes,
        })
        .eq("id", existingSchedule.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("client_schedules").insert({
        client_id: clientId,
        day_of_week: toDayOfWeek,
        time_of_day: toTime,
        duration_minutes: durationMinutes,
      });
      if (error) throw new Error(error.message);
    }
  } else if (fromDate === toDate) {
    const { error } = await supabase.from("session_occurrences").upsert(
      {
        client_id: clientId,
        occurrence_date: toDate,
        status: "scheduled",
        notes: `Confirmed request — ${toTime}`,
        duration_minutes: durationMinutes,
      },
      { onConflict: "client_id,occurrence_date" }
    );
    if (error) throw new Error(error.message);
  } else {
    const { error: fromError } = await supabase.from("session_occurrences").upsert(
      {
        client_id: clientId,
        occurrence_date: fromDate,
        status: "rescheduled",
        rescheduled_to_date: toDate,
      },
      { onConflict: "client_id,occurrence_date" }
    );
    if (fromError) throw new Error(fromError.message);

    const { error: toError } = await supabase.from("session_occurrences").upsert(
      {
        client_id: clientId,
        occurrence_date: toDate,
        status: "scheduled",
        notes: `Confirmed request — ${toTime}`,
        duration_minutes: durationMinutes,
      },
      { onConflict: "client_id,occurrence_date" }
    );
    if (toError) throw new Error(toError.message);
  }

  const whenText = permanent
    ? `every ${DAY_NAMES[toDayOfWeek]} at ${formatTimeOfDay(toTime)}, starting ${toDate}`
    : `${toDate} at ${formatTimeOfDay(toTime)}`;

  try {
    const { data: client } = await supabase
      .from("clients")
      .select("name, user_id")
      .eq("id", clientId)
      .single();
    if (client) {
      const email = await clientLoginEmail(client.user_id);
      if (email) {
        await sendSessionRescheduledEmail(email, client.name, fromDate, whenText);
      }
    }
  } catch (emailError) {
    console.error("Failed to send session-rescheduled email", emailError);
  }

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath(`/coach/clients/${clientId}/schedule`);
  revalidatePath("/coach/schedule");
  revalidatePath("/coach/availability");
  revalidatePath("/client/schedule");
  revalidatePath("/client/dashboard");
}

// "Semi-merged" booking partners (e.g. two friends who always train
// together but are on entirely separate programs) -- true only when the
// partner has a booking at this *exact* date+time, so a coincidental
// unrelated booking never gets swept up. Only checks the regular weekly
// pattern plus one-off confirmed-time bookings, same as the rest of the
// scheduling logic elsewhere in this file.
async function findPartnerScheduleMatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  partnerId: string,
  date: string,
  time: string
): Promise<{ clientScheduleId: string | null } | null> {
  const norm = (t: string) => t.slice(0, 5);
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();

  const [{ data: schedules }, { data: occurrence }] = await Promise.all([
    supabase
      .from("client_schedules")
      .select("id, time_of_day")
      .eq("client_id", partnerId)
      .eq("active", true)
      .eq("day_of_week", dayOfWeek),
    supabase
      .from("session_occurrences")
      .select("status, notes")
      .eq("client_id", partnerId)
      .eq("occurrence_date", date)
      .maybeSingle(),
  ]);

  const recurringMatch = (schedules ?? []).find((s) => norm(s.time_of_day) === norm(time));
  if (recurringMatch) {
    // An override other than "completed" means this date's already been
    // resolved independently for the partner (they cancelled it
    // themselves, it was already moved, etc) -- leave it alone.
    if (occurrence && occurrence.status !== "completed" && occurrence.status !== "scheduled") {
      return null;
    }
    return { clientScheduleId: recurringMatch.id };
  }

  if (occurrence?.status === "scheduled") {
    const timeMatch = occurrence.notes?.match(/Confirmed request — (\d{2}:\d{2})/);
    if (timeMatch && norm(timeMatch[1]) === norm(time)) {
      return { clientScheduleId: null };
    }
  }

  return null;
}

export async function coachRescheduleSession(
  clientId: string,
  fromDate: string,
  fromTime: string,
  toDate: string,
  toTime: string,
  durationMinutes: number,
  permanent = false
) {
  await coachRescheduleSessionCore(
    clientId,
    fromDate,
    fromTime,
    toDate,
    toTime,
    durationMinutes,
    permanent
  );

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("partner_client_id")
    .eq("id", clientId)
    .single();
  if (!client?.partner_client_id) return;

  const match = await findPartnerScheduleMatch(supabase, client.partner_client_id, fromDate, fromTime);
  if (!match) return;

  try {
    await coachRescheduleSessionCore(
      client.partner_client_id,
      fromDate,
      fromTime,
      toDate,
      toTime,
      durationMinutes,
      permanent
    );
  } catch (err) {
    console.error("Failed to mirror reschedule to booking partner", err);
  }
}

function timeToMinutes(t: string): number {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function timesOverlap(
  aStart: string,
  aDurationMinutes: number,
  bStart: string,
  bDurationMinutes: number
): boolean {
  const aS = timeToMinutes(aStart);
  const bS = timeToMinutes(bStart);
  return aS < bS + bDurationMinutes && bS < aS + aDurationMinutes;
}

// Clicking an open slot on the schedule grid books it directly -- no
// request/accept round trip, since the coach is the one initiating this.
// Mirrors submitRequest's own conflict checks (client/actions.ts) so a
// slot that looks open on the grid can't silently double-book someone.
async function coachBookSessionCore(
  clientId: string,
  date: string,
  time: string,
  requestType: "session" | "checkin_call" | "video_session",
  recurring = false,
  durationMinutesOverride?: number
) {
  const supabase = await createClient();

  let durationMinutes = CALL_DURATION_MINUTES;
  if (requestType === "session") {
    if (recurring && durationMinutesOverride) {
      durationMinutes = durationMinutesOverride === 30 ? 30 : 60;
    } else {
      const { data: mySchedule } = await supabase
        .from("client_schedules")
        .select("duration_minutes")
        .eq("client_id", clientId)
        .eq("active", true)
        .limit(1)
        .maybeSingle();
      durationMinutes = mySchedule?.duration_minutes ?? 60;
    }
  }

  const { data: blockedRows } = await supabase
    .from("coach_blocked_dates")
    .select("start_time, end_time")
    .eq("blocked_date", date);
  for (const b of blockedRows ?? []) {
    if (!b.start_time || !b.end_time) {
      throw new Error("That whole day is blocked off.");
    }
    const blockStart = b.start_time.slice(0, 5);
    const blockDurationMinutes = timeToMinutes(b.end_time.slice(0, 5)) - timeToMinutes(blockStart);
    if (timesOverlap(time, durationMinutes, blockStart, blockDurationMinutes)) {
      throw new Error("That time is blocked off.");
    }
  }

  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
  const [{ data: recurringSchedules }, { data: dateOccurrences }] = await Promise.all([
    supabase
      .from("client_schedules")
      .select("client_id, time_of_day, duration_minutes")
      .eq("day_of_week", dayOfWeek)
      .eq("active", true),
    supabase
      .from("session_occurrences")
      .select("client_id, status, notes, duration_minutes")
      .eq("occurrence_date", date),
  ]);

  const overrideStatusByClient = new Map(
    (dateOccurrences ?? []).map((o) => [o.client_id, o.status])
  );
  const recurringConflict = (recurringSchedules ?? []).some((s) => {
    // Any override for this client on this date (including a same-day
    // reschedule's new "scheduled" time) supersedes their recurring
    // default -- only "completed" leaves the default's own time in play.
    const overrideStatus = overrideStatusByClient.get(s.client_id);
    const overridden = overrideStatus !== undefined && overrideStatus !== "completed";
    return !overridden && timesOverlap(time, durationMinutes, s.time_of_day, s.duration_minutes);
  });
  const oneOffConflict = (dateOccurrences ?? []).some((o) => {
    if (o.status !== "scheduled") return false;
    const match = o.notes?.match(/Confirmed request — (\d{2}:\d{2})/);
    if (!match) return false;
    return timesOverlap(time, durationMinutes, match[1], o.duration_minutes);
  });
  if (recurringConflict || oneOffConflict) {
    throw new Error("That time is already booked — pick another slot.");
  }

  // Recurring only makes sense for a standard training session -- video
  // and check-in calls have no representation in client_schedules, so
  // this is always a one-off for those regardless of what was passed in.
  const isRecurring = recurring && requestType === "session";

  if (isRecurring) {
    const { error } = await supabase.from("client_schedules").insert({
      client_id: clientId,
      day_of_week: dayOfWeek,
      time_of_day: time,
      duration_minutes: durationMinutes,
    });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("session_occurrences").upsert(
      {
        client_id: clientId,
        occurrence_date: date,
        status: "scheduled",
        notes: `Confirmed request — ${time}`,
        duration_minutes: durationMinutes,
        is_video_session: requestType === "video_session",
      },
      { onConflict: "client_id,occurrence_date" }
    );
    if (error) throw new Error(error.message);
  }

  // A video session is normally paid up front through the client's own
  // request flow (submitRequest, client/actions.ts) -- booking one
  // directly here still needs that payment record to exist so it shows up
  // correctly in Finances, it's just left unpaid/due rather than gating
  // the booking on payment first, since the coach is creating this herself.
  if (requestType === "video_session") {
    const { error: paymentError } = await supabase.from("payments").insert({
      client_id: clientId,
      description: `Video session — ${date} at ${formatTimeOfDay(time)}`,
      amount: VIDEO_SESSION_RATE,
      due_date: date,
      kind: "session",
    });
    if (paymentError) throw new Error(paymentError.message);
  }

  const kindLabel =
    requestType === "video_session"
      ? "video session"
      : requestType === "checkin_call"
        ? "check-in call"
        : "session";

  const whenText = isRecurring
    ? `every ${DAY_NAMES[dayOfWeek]} at ${formatTimeOfDay(time)}, starting ${date}`
    : `${date} at ${formatTimeOfDay(time)}`;

  try {
    const { data: client } = await supabase
      .from("clients")
      .select("name, user_id")
      .eq("id", clientId)
      .single();
    if (client) {
      const email = await clientLoginEmail(client.user_id);
      if (email) {
        await sendSessionBookedEmail(email, client.name, whenText, kindLabel);
      }
    }
  } catch (emailError) {
    console.error("Failed to send session-booked email", emailError);
  }

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath(`/coach/clients/${clientId}/schedule`);
  revalidatePath("/coach/schedule");
  revalidatePath("/coach/availability");
  revalidatePath("/coach/finances");
  revalidatePath("/client/schedule");
  revalidatePath("/client/dashboard");
}

// Clicking an open slot on the schedule grid books it directly -- no
// request/accept round trip, since the coach is the one initiating this.
// A booking partner (two separate clients who always attend together) is
// booked at the exact same date/time/type automatically -- if that
// conflicts with something already on the partner's own calendar, the
// primary booking still goes through and the partner side is just skipped,
// since failing the whole thing over a partner-side conflict would be
// more surprising than helpful.
export async function coachBookSession(
  clientId: string,
  date: string,
  time: string,
  requestType: "session" | "checkin_call" | "video_session",
  recurring = false,
  durationMinutesOverride?: number
) {
  await coachBookSessionCore(clientId, date, time, requestType, recurring, durationMinutesOverride);

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("partner_client_id")
    .eq("id", clientId)
    .single();
  if (!client?.partner_client_id) return;

  try {
    await coachBookSessionCore(
      client.partner_client_id,
      date,
      time,
      requestType,
      recurring,
      durationMinutesOverride
    );
  } catch (err) {
    console.error("Failed to mirror booking to booking partner", err);
  }
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
  const files = formData.getAll("file");

  const entries: SessionEntry[] = (
    await Promise.all(
      exercises.map(async (exercise, i) => {
        const trimmed = exercise?.trim() ?? "";
        if (!trimmed) return null;

        let media_path: string | null = null;
        const file = files[i];
        if (file instanceof File && file.size > 0) {
          const path = `${clientId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
          const { error: uploadError } = await supabase.storage
            .from("form-checks")
            .upload(path, file, { contentType: file.type });
          if (uploadError) throw new Error(uploadError.message);
          media_path = path;
        }

        const entry: SessionEntry = {
          exercise: trimmed,
          sets: sets[i] ?? "",
          reps: reps[i] ?? "",
          weight: weights[i] ?? "",
        };
        if (media_path) entry.media_path = media_path;
        return entry;
      })
    )
  ).filter((e): e is SessionEntry => e !== null);

  if (!day_label || !date) {
    throw new Error("Day label and date are required.");
  }

  const paymentStatusRaw = String(formData.get("payment_status") ?? "");
  const payment_status = (
    ["paid", "unpaid", "waived"].includes(paymentStatusRaw) ? paymentStatusRaw : null
  ) as "paid" | "unpaid" | "waived" | null;

  // Defaults to coached (checkbox is checked unless she unchecks it) --
  // she's normally logging a session she actually ran; unchecking it is
  // for the case of recording something a client told her they did on
  // their own.
  const coached = formData.get("coached") === "on";

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
    coached,
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
  redirect(`/coach/clients/${clientId}?tab=log`);
}

// Cleans up a mis-logged entry -- e.g. a client using the prescribed-day
// log form for something that was actually out-of-session activity. The
// clientId check is just defense against a stale/tampered id from an old
// page load, not a real cross-client risk (this is coach-only already).
export async function deleteLoggedSession(clientId: string, sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .eq("client_id", clientId);
  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
}

// Lets the coach log an out-of-session activity on a client's behalf --
// e.g. re-recording something they mistakenly logged as a prescribed
// session, or something they mentioned in person, without needing the
// client to do it themselves.
export async function addActivityAsCoach(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const date = String(formData.get("date") ?? "");
  const type = String(formData.get("type") ?? "").trim();
  const duration = String(formData.get("duration") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!date || !type) throw new Error("Date and type are required.");

  let photoPath: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const path = `${clientId}/activity-${crypto.randomUUID()}-${safeFileName(photo.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("form-checks")
      .upload(path, photo, { contentType: photo.type });
    if (uploadError) throw new Error(uploadError.message);
    photoPath = path;
  }

  const { error } = await supabase.from("activities").insert({
    client_id: clientId,
    date,
    type,
    duration: duration || null,
    notes: notes || null,
    logged_by: "coach",
    photo_path: photoPath,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
}

// Private planning notes on a logged workout or activity -- never exposed
// to the client (every client-facing query explicitly omits this column;
// see migration 0083). Meant for things like "favored the left knee,
// check in on that" or "skipped the accessory work again" that shape the
// next session without going in the client-visible notes.
export async function setLogEntryCoachNotes(
  clientId: string,
  entryKind: "session" | "activity",
  entryId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const coach_notes = String(formData.get("coach_notes") ?? "").trim() || null;

  const table = entryKind === "session" ? "sessions" : "activities";
  const { error } = await supabase
    .from(table)
    .update({ coach_notes })
    .eq("id", entryId)
    .eq("client_id", clientId);
  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
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
  const durationRaw = String(formData.get("duration_minutes") ?? "60");
  const durationMinutes = durationRaw === "30" ? 30 : 60;

  if (dayOfWeek === "" || !timeOfDay) {
    throw new Error("Day and time are required.");
  }

  const { error } = await supabase.from("client_schedules").insert({
    client_id: clientId,
    day_of_week: Number(dayOfWeek),
    time_of_day: timeOfDay,
    duration_minutes: durationMinutes,
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

  const { data: schedule } = await supabase
    .from("client_schedules")
    .select("day_of_week, time_of_day")
    .eq("id", scheduleId)
    .single();

  const { error } = await supabase
    .from("client_schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}/schedule`);
  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath("/coach/schedule");

  // Mirror the removal to a booking partner's matching recurring slot, if
  // any -- a "lost cause" removal is meant to end the pair's booking
  // together, not leave the partner still expected to show up alone.
  if (!schedule) return;
  const { data: client } = await supabase
    .from("clients")
    .select("partner_client_id")
    .eq("id", clientId)
    .single();
  if (!client?.partner_client_id) return;

  const { data: partnerSchedule } = await supabase
    .from("client_schedules")
    .select("id")
    .eq("client_id", client.partner_client_id)
    .eq("day_of_week", schedule.day_of_week)
    .eq("time_of_day", schedule.time_of_day)
    .maybeSingle();
  if (!partnerSchedule) return;

  try {
    const { error: partnerError } = await supabase
      .from("client_schedules")
      .delete()
      .eq("id", partnerSchedule.id);
    if (partnerError) throw new Error(partnerError.message);
    revalidatePath(`/coach/clients/${client.partner_client_id}/schedule`);
    revalidatePath(`/coach/clients/${client.partner_client_id}`);
  } catch (err) {
    console.error("Failed to mirror schedule removal to booking partner", err);
  }
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

export async function updateBusinessFinanceSettings(formData: FormData) {
  const supabase = await createClient();

  const rateRaw = String(formData.get("estimated_tax_rate") ?? "").trim();

  const { error } = await supabase
    .from("business_finance_settings")
    .update({
      estimated_tax_rate: rateRaw ? Number(rateRaw) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) throw new Error(error.message);

  revalidatePath("/coach/finances");
}

export async function addExpense(formData: FormData) {
  const supabase = await createClient();

  const date = String(formData.get("date") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const amount = String(formData.get("amount") ?? "");

  if (!date || !category || !amount) {
    throw new Error("Date, category, and amount are required.");
  }

  const { error } = await supabase.from("business_expenses").insert({
    date,
    category,
    description,
    amount: Number(amount),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/coach/finances");
}

export async function deleteExpense(expenseId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("business_expenses")
    .delete()
    .eq("id", expenseId);

  if (error) throw new Error(error.message);

  revalidatePath("/coach/finances");
}

export async function addCredential(formData: FormData) {
  const supabase = await createClient();

  const label = String(formData.get("label") ?? "").trim();
  const renewalDate = String(formData.get("renewal_date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!label || !renewalDate) {
    throw new Error("Label and renewal date are required.");
  }

  const { error } = await supabase.from("business_credentials").insert({
    label,
    renewal_date: renewalDate,
    notes: notes || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/coach/finances");
}

export async function deleteCredential(credentialId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("business_credentials")
    .delete()
    .eq("id", credentialId);

  if (error) throw new Error(error.message);

  revalidatePath("/coach/finances");
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

export async function addPaymentFromLedger(formData: FormData) {
  const supabase = await createClient();

  const clientId = String(formData.get("client_id") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const amount = String(formData.get("amount") ?? "");
  const dueDate = String(formData.get("due_date") ?? "");

  if (!clientId || !description || !amount || !dueDate) {
    throw new Error("Client, description, amount, and due date are required.");
  }

  const { error } = await supabase.from("payments").insert({
    client_id: clientId,
    description,
    amount: Number(amount),
    due_date: dueDate,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/coach/finances");
  revalidatePath(`/coach/clients/${clientId}`);
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
  revalidatePath("/coach/finances");
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
  revalidatePath("/coach/sign-ons");
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
  revalidatePath("/coach/sign-ons");
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
  revalidatePath("/coach/sign-ons");
}

// Links two clients as booking partners -- "semi-merged" for scheduling
// only (booking/rescheduling/cancelling one mirrors to the other), while
// everything else about them (program, phase, goals, payments) stays
// completely separate. Always symmetric: setting A's partner to B also
// sets B's partner to A, and clears whichever partner either of them had
// before, since a client can only ever be paired with one other client
// at a time. This doesn't touch either client's existing schedule --
// linking just means future booking/reschedule/cancel actions from
// either side apply to both going forward.
export async function setClientPartner(clientId: string, partnerClientId: string | null) {
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("partner_client_id")
    .eq("id", clientId)
    .single();
  const previousPartnerId = client?.partner_client_id ?? null;

  if (previousPartnerId && previousPartnerId !== partnerClientId) {
    const { error } = await supabase
      .from("clients")
      .update({ partner_client_id: null })
      .eq("id", previousPartnerId);
    if (error) throw new Error(error.message);
  }

  if (partnerClientId) {
    // The new partner might already be paired with someone else -- break
    // that pairing first so no client ever ends up with a one-way link.
    const { data: newPartner } = await supabase
      .from("clients")
      .select("partner_client_id")
      .eq("id", partnerClientId)
      .single();
    if (newPartner?.partner_client_id && newPartner.partner_client_id !== clientId) {
      const { error } = await supabase
        .from("clients")
        .update({ partner_client_id: null })
        .eq("id", newPartner.partner_client_id);
      if (error) throw new Error(error.message);
    }
  }

  const { error: clientError } = await supabase
    .from("clients")
    .update({ partner_client_id: partnerClientId })
    .eq("id", clientId);
  if (clientError) throw new Error(clientError.message);

  if (partnerClientId) {
    const { error: partnerError } = await supabase
      .from("clients")
      .update({ partner_client_id: clientId })
      .eq("id", partnerClientId);
    if (partnerError) throw new Error(partnerError.message);
  }

  revalidatePath(`/coach/clients/${clientId}`);
  if (partnerClientId) revalidatePath(`/coach/clients/${partnerClientId}`);
  if (previousPartnerId) revalidatePath(`/coach/clients/${previousPartnerId}`);
  revalidatePath("/coach/roster");
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
  const pro_bono_rate_raw = String(formData.get("pro_bono_rate") ?? "").trim();
  const daily_calorie_goal_raw = String(formData.get("daily_calorie_goal") ?? "").trim();

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
      pro_bono: formData.get("pro_bono") === "on",
      pro_bono_rate: pro_bono_rate_raw ? Number(pro_bono_rate_raw) : null,
      calorie_goal_enabled: formData.get("calorie_goal_enabled") === "on",
      daily_calorie_goal: daily_calorie_goal_raw ? Number(daily_calorie_goal_raw) : null,
      is_test: formData.get("is_test") === "on",
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
async function coachCancelSessionCore(
  clientId: string,
  occurrenceDate: string,
  clientScheduleId: string | null,
  isEmergency: boolean
) {
  const supabase = await createClient();

  const { error } = await supabase.from("session_occurrences").upsert(
    {
      client_id: clientId,
      ...(clientScheduleId ? { client_schedule_id: clientScheduleId } : {}),
      occurrence_date: occurrenceDate,
      status: "cancelled",
      cancelled_by: "coach",
      ...(isEmergency ? { notes: "Client emergency — excused, no charge." } : {}),
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
        if (isEmergency) {
          await sendEmergencyCancelledSessionEmail(email, client.name, occurrenceDate);
        } else {
          await sendCoachCancelledSessionEmail(email, client.name, occurrenceDate);
        }
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

// timeOfDay is optional only for backward compatibility with older call
// sites -- without it, a booking partner's matching slot can't be found,
// so the cancellation just applies to this one client as before.
export async function coachCancelSession(
  clientId: string,
  occurrenceDate: string,
  clientScheduleId: string | null,
  isEmergency: boolean = false,
  timeOfDay: string | null = null
) {
  await coachCancelSessionCore(clientId, occurrenceDate, clientScheduleId, isEmergency);

  if (!timeOfDay) return;

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("partner_client_id")
    .eq("id", clientId)
    .single();
  if (!client?.partner_client_id) return;

  const match = await findPartnerScheduleMatch(supabase, client.partner_client_id, occurrenceDate, timeOfDay);
  if (!match) return;

  try {
    await coachCancelSessionCore(
      client.partner_client_id,
      occurrenceDate,
      match.clientScheduleId,
      isEmergency
    );
  } catch (err) {
    console.error("Failed to mirror cancellation to booking partner", err);
  }
}
