"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMyClient } from "@/lib/current-client";
import {
  adjustFreeRemainingForSwitch,
  effectiveFreeRemaining,
  isLateCancellation,
  lateCancellationFeeAmount,
  LATE_CANCEL_WINDOW_DAYS,
} from "@/lib/cancellation";
import { BUSINESS_TIMEZONE, convertWallTime, toDateString, nowInBusinessTz } from "@/lib/timezone";
import { CALL_DURATION_MINUTES, VIDEO_SESSION_RATE } from "@/lib/video-session";
import { clientHasOverdueBalance } from "@/lib/payment-status";
import { safeFileName } from "@/lib/storage";
import type { PaymentSchedule } from "@/lib/types";

export async function logCheckin(formData: FormData) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

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
    client_id: me.id,
    date,
    sleep: sleep || null,
    water: water || null,
    food: food || null,
    energy: energy || null,
    mood: mood || null,
    notes: notes || null,
    logged_by: "client",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/client/dashboard");
  redirect("/client/dashboard");
}

export async function logActivity(formData: FormData) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();

  const date = String(formData.get("date") ?? "");
  const type = String(formData.get("type") ?? "");
  const duration = String(formData.get("duration") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!date || !type) throw new Error("Date and type are required.");

  let photoPath: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const path = `${me.id}/activity-${crypto.randomUUID()}-${safeFileName(photo.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("form-checks")
      .upload(path, photo, { contentType: photo.type });
    if (uploadError) throw new Error(uploadError.message);
    photoPath = path;
  }

  const { error } = await supabase.from("activities").insert({
    client_id: me.id,
    date,
    type,
    duration: duration || null,
    notes: notes || null,
    logged_by: "client",
    photo_path: photoPath,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/client/activity");
  revalidatePath("/client/dashboard");
  redirect("/client/activity");
}

export async function submitServiceCheckin(formData: FormData) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();

  const date = String(formData.get("date") ?? "");
  const satisfactionRaw = String(formData.get("satisfaction") ?? "");
  const what_working = String(formData.get("what_working") ?? "").trim();
  const what_would_help = String(formData.get("what_would_help") ?? "").trim();
  const anything_else = String(formData.get("anything_else") ?? "").trim();
  const testimonial_consent = formData.get("testimonial_consent") === "on";

  if (!date) throw new Error("Date is required.");

  const { error } = await supabase.from("service_checkins").insert({
    client_id: me.id,
    date,
    satisfaction: satisfactionRaw ? Number(satisfactionRaw) : null,
    what_working: what_working || null,
    what_would_help: what_would_help || null,
    anything_else: anything_else || null,
    testimonial_consent,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/client/documents");
  revalidatePath("/client/dashboard");
  redirect("/client/documents");
}

export async function addProgressPhoto(formData: FormData) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const date = String(formData.get("date") ?? "");
  const angle = String(formData.get("angle") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim();
  if (!date) throw new Error("Date is required.");

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    throw new Error("A photo is required.");
  }

  const supabase = await createClient();

  const path = `${me.id}/progress-${crypto.randomUUID()}-${safeFileName(photo.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("form-checks")
    .upload(path, photo, { contentType: photo.type });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase.from("client_progress_photos").insert({
    client_id: me.id,
    date,
    angle,
    photo_path: path,
    notes: notes || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/client/progress");
}

export async function deleteProgressPhoto(photoId: string) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_progress_photos")
    .delete()
    .eq("id", photoId)
    .eq("client_id", me.id);
  if (error) throw new Error(error.message);

  revalidatePath("/client/progress");
}

function toMinutes(t: string): number {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

// True if [aStart, aStart+aDur) overlaps [bStart, bStart+bDur) at all --
// used everywhere a booking used to only ever check its exact starting
// minute, which let a longer session get double-booked into any of the
// slots after its start.
function overlaps(aStart: string, aDur: number, bStart: string, bDur: number): boolean {
  const aS = toMinutes(aStart);
  const bS = toMinutes(bStart);
  return aS < bS + bDur && bS < aS + aDur;
}

export async function submitRequest(formData: FormData) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();

  const preferred_date = String(formData.get("preferred_date") ?? "");
  const preferred_time = String(formData.get("preferred_time") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const reschedule_from_date =
    String(formData.get("reschedule_from_date") ?? "").trim() || null;
  const requestTypeRaw = String(formData.get("request_type") ?? "session");
  const request_type =
    requestTypeRaw === "checkin_call" || requestTypeRaw === "video_session"
      ? requestTypeRaw
      : "session";

  const backTo = (error: string) => {
    const params = new URLSearchParams({ error });
    if (reschedule_from_date) params.set("reschedule_from", reschedule_from_date);
    const base =
      request_type === "checkin_call"
        ? "/client/checkin-call"
        : request_type === "video_session"
          ? "/client/video-session"
          : "/client/request";
    return `${base}?${params.toString()}`;
  };

  if (request_type === "video_session" && !me.video_sessions_enabled) {
    redirect(backTo("Video sessions aren't enabled on your profile -- ask Mickey."));
  }

  // Belt-and-suspenders: the request pages already hide this form behind
  // an overdue balance, but the action itself has to enforce it too since
  // a form POST doesn't go through page rendering.
  if (await clientHasOverdueBalance(supabase, me.id, toDateString(nowInBusinessTz()))) {
    redirect(backTo("You have an outstanding balance -- new requests are disabled until it's paid."));
  }

  if (!preferred_date) {
    redirect(backTo("Preferred date is required."));
  }

  // Anything below can fail for reasons entirely outside the client's
  // control (a day Mickey just blocked, a slot someone else just took) --
  // this should land back on a friendly inline message, never a crash.
  try {
    // Everything the client typed is in their own timezone; everything
    // stored and checked against (blocked dates, availability windows,
    // other clients' schedules) is business-tz wall-clock time -- convert
    // once here so the rest of this function never has to think about it
    // again. May shift the calendar date near midnight for a client far
    // from the business timezone.
    const clientTz = me.timezone || BUSINESS_TIMEZONE;
    let businessDate = preferred_date;
    let businessTime = preferred_time;
    if (preferred_time && clientTz !== BUSINESS_TIMEZONE) {
      const converted = convertWallTime(
        preferred_date,
        preferred_time,
        clientTz,
        BUSINESS_TIMEZONE
      );
      businessDate = converted.date;
      businessTime = converted.time;
    }

    const dayOfWeek = new Date(`${businessDate}T00:00:00Z`).getUTCDay();

    const { data: blockedRows } = await supabase
      .from("coach_blocked_dates")
      .select("start_time, end_time")
      .eq("blocked_date", businessDate);
    for (const b of blockedRows ?? []) {
      if (!b.start_time || !b.end_time) {
        throw new Error(
          "Mickey isn't available that day — please choose a different date."
        );
      }
      if (
        businessTime &&
        businessTime >= b.start_time.slice(0, 5) &&
        businessTime < b.end_time.slice(0, 5)
      ) {
        throw new Error(
          "That time is unavailable — please choose a different time."
        );
      }
    }

    const { data: availability } = await supabase
      .from("coach_availability")
      .select("start_time, end_time")
      .eq("day_of_week", dayOfWeek);
    const { count: anyAvailabilitySet } = await supabase
      .from("coach_availability")
      .select("id", { count: "exact", head: true });

    if ((anyAvailabilitySet ?? 0) > 0) {
      if (!availability || availability.length === 0) {
        throw new Error(
          "Mickey isn't available on that day of the week — please choose a different date."
        );
      }
      if (businessTime) {
        const withinWindow = availability.some(
          (a) =>
            businessTime! >= a.start_time.slice(0, 5) &&
            businessTime! < a.end_time.slice(0, 5)
        );
        if (!withinWindow) {
          throw new Error(
            "That time is outside Mickey's available hours that day — please choose a different time."
          );
        }
      }
    }

    // A session request books for however long this client's own
    // arrangement normally runs (30 minutes for a negotiated exception
    // like Sandra, 60 otherwise) -- never a client-facing choice. Calls
    // are always the fixed call length.
    let durationMinutes = CALL_DURATION_MINUTES;
    if (request_type === "session") {
      const { data: myActiveSchedule } = await supabase
        .from("client_schedules")
        .select("duration_minutes")
        .eq("client_id", me.id)
        .eq("active", true)
        .limit(1)
        .maybeSingle();
      durationMinutes = myActiveSchedule?.duration_minutes ?? 60;
    }

    // A recurring or already-confirmed one-off session belonging to
    // another client isn't visible under this client's own RLS session,
    // so this narrow cross-client read needs the service role -- it only
    // checks for an overlap, never exposes another client's details back
    // to the requester. Checks the full span each booking actually
    // occupies, not just whether it starts at the same minute.
    if (businessTime) {
      const admin = createAdminClient();
      const { data: sameDaySchedules } = await admin
        .from("client_schedules")
        .select("time_of_day, duration_minutes")
        .eq("day_of_week", dayOfWeek)
        .eq("active", true);
      const recurringConflict = (sameDaySchedules ?? []).some((s) =>
        overlaps(businessTime!, durationMinutes, s.time_of_day, s.duration_minutes)
      );

      const { data: oneOffScheduled } = await admin
        .from("session_occurrences")
        .select("notes, duration_minutes")
        .eq("occurrence_date", businessDate)
        .eq("status", "scheduled");
      const oneOffTimeTaken = (oneOffScheduled ?? []).some((o) => {
        const match = o.notes?.match(/Confirmed request — (\d{2}:\d{2})/);
        if (!match) return false;
        return overlaps(businessTime!, durationMinutes, match[1], o.duration_minutes);
      });

      if (recurringConflict || oneOffTimeTaken) {
        throw new Error("That time is already taken — please choose a different time.");
      }
    }

    const { data: newRequest, error } = await supabase
      .from("requests")
      .insert({
        client_id: me.id,
        preferred_date: businessDate,
        preferred_time: businessTime || null,
        note: note || null,
        reschedule_from_date,
        request_type,
        duration_minutes: durationMinutes,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    // A video session isn't invoiced after the fact like a normal session
    // -- it's paid up front, and the coach only confirms the timeslot once
    // that balance is marked paid. The RLS policy backing this insert
    // pins kind/amount/request_id so a client can't create anything else
    // through this path.
    if (request_type === "video_session") {
      const { error: paymentError } = await supabase.from("payments").insert({
        client_id: me.id,
        description: `Video session — ${businessDate}${businessTime ? ` at ${businessTime}` : ""}`,
        amount: VIDEO_SESSION_RATE,
        due_date: businessDate,
        kind: "session",
        request_id: newRequest.id,
      });
      if (paymentError) throw new Error(paymentError.message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    redirect(backTo(message));
  }

  revalidatePath("/client/dashboard");
  revalidatePath("/client/schedule");
  redirect("/client/dashboard");
}

// Requests has no client-facing update policy (only coach: full access,
// client: insert own) -- everything below runs through the admin client,
// same reasoning as the cross-client conflict check in submitRequest.
// The .eq("client_id", me.id) and .eq("status", "countered") guards on
// the initial read are what keep this scoped to the caller's own,
// still-open counter-offer even though the write itself bypasses RLS.
export async function respondToCounteredRequest(
  requestId: string,
  decision: "accept" | "decline"
) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const admin = createAdminClient();
  const { data: request, error } = await admin
    .from("requests")
    .select(
      "countered_date, countered_time, reschedule_from_date, request_type, duration_minutes"
    )
    .eq("id", requestId)
    .eq("client_id", me.id)
    .eq("status", "countered")
    .single();
  if (error || !request || !request.countered_date) {
    throw new Error("That proposed time is no longer available.");
  }

  if (decision === "decline") {
    const { error: updateError } = await admin
      .from("requests")
      .update({ status: "declined" })
      .eq("id", requestId);
    if (updateError) throw new Error(updateError.message);
  } else {
    const { error: updateError } = await admin
      .from("requests")
      .update({
        status: "confirmed",
        preferred_date: request.countered_date,
        preferred_time: request.countered_time,
      })
      .eq("id", requestId);
    if (updateError) throw new Error(updateError.message);

    if (request.reschedule_from_date) {
      const { error: originalError } = await admin
        .from("session_occurrences")
        .upsert(
          {
            client_id: me.id,
            occurrence_date: request.reschedule_from_date,
            status: "rescheduled",
            rescheduled_to_date: request.countered_date,
          },
          { onConflict: "client_id,occurrence_date" }
        );
      if (originalError) throw new Error(originalError.message);
    }

    const { error: occurrenceError } = await admin
      .from("session_occurrences")
      .upsert(
        {
          client_id: me.id,
          occurrence_date: request.countered_date,
          status: "scheduled",
          notes: request.countered_time
            ? `Confirmed request — ${request.countered_time}`
            : "Confirmed request",
          is_video_session: request.request_type === "video_session",
          duration_minutes: request.duration_minutes,
        },
        { onConflict: "client_id,occurrence_date" }
      );
    if (occurrenceError) throw new Error(occurrenceError.message);
  }

  revalidatePath("/client/dashboard");
  revalidatePath("/client/schedule");
  revalidatePath("/coach/schedule");
  revalidatePath(`/coach/clients/${me.id}`);
}

export async function cancelMySession(
  clientScheduleId: string | null,
  occurrenceDate: string,
  timeOfDay: string | null
) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();

  // A one-off confirmed request has no recurring schedule (and often no
  // stored time), so lateness can only be judged when we actually have a
  // time to check against -- otherwise it's just a plain cancel.
  const late = timeOfDay ? isLateCancellation(occurrenceDate, timeOfDay) : false;
  const status = late ? "late_cancelled" : "cancelled";

  // Free-cancellation accounting must only ever run once per actual late
  // cancellation -- this upsert is otherwise idempotent (same status wins
  // on a resubmit), but decrementing a stored counter is not, so check the
  // prior state before touching anything.
  const { data: existingOccurrence } = await supabase
    .from("session_occurrences")
    .select("status")
    .eq("client_id", me.id)
    .eq("occurrence_date", occurrenceDate)
    .maybeSingle();
  const isNewLateCancellation = late && existingOccurrence?.status !== "late_cancelled";

  let priorLateCancellationCount = 0;
  if (isNewLateCancellation) {
    const windowCutoff = new Date();
    windowCutoff.setUTCDate(windowCutoff.getUTCDate() - LATE_CANCEL_WINDOW_DAYS);
    const { count } = await supabase
      .from("session_occurrences")
      .select("id", { count: "exact", head: true })
      .eq("client_id", me.id)
      .eq("status", "late_cancelled")
      .gte("occurrence_date", windowCutoff.toISOString().slice(0, 10));
    priorLateCancellationCount = count ?? 0;
  }

  const { data: occurrence, error } = await supabase
    .from("session_occurrences")
    .upsert(
      {
        client_id: me.id,
        ...(clientScheduleId ? { client_schedule_id: clientScheduleId } : {}),
        occurrence_date: occurrenceDate,
        status,
        cancelled_by: "client",
      },
      { onConflict: "client_id,occurrence_date" }
    )
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (isNewLateCancellation && !me.pro_bono) {
    const remaining = effectiveFreeRemaining(
      me.late_cancel_free_remaining,
      priorLateCancellationCount > 0,
      me.payment_schedule
    );

    if (remaining > 0) {
      const { error: remainingError } = await supabase
        .from("clients")
        .update({ late_cancel_free_remaining: remaining - 1 })
        .eq("id", me.id);
      if (remainingError) throw new Error(remainingError.message);
    } else {
      const { error: feeError } = await supabase.from("payments").insert({
        client_id: me.id,
        description: "Late cancellation fee",
        amount: lateCancellationFeeAmount(me.payment_schedule),
        due_date: new Date().toISOString().slice(0, 10),
        kind: "late_cancellation_fee",
        session_occurrence_id: occurrence.id,
      });
      if (feeError) throw new Error(feeError.message);

      const { error: remainingError } = await supabase
        .from("clients")
        .update({ late_cancel_free_remaining: 0 })
        .eq("id", me.id);
      if (remainingError) throw new Error(remainingError.message);
    }
  }

  revalidatePath("/client/schedule");
  revalidatePath("/client/dashboard");
}

export async function acknowledgeDocument(
  documentId: string,
  documentVersion: number,
  requiresSignature: boolean,
  formData: FormData
) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const signedName = String(formData.get("signed_name") ?? "").trim();

  if (requiresSignature && !signedName) {
    throw new Error("Type your full legal name to sign this document.");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("client_document_acknowledgments").upsert(
    {
      client_id: me.id,
      document_id: documentId,
      document_version: documentVersion,
      signed_name: requiresSignature ? signedName : null,
    },
    { onConflict: "client_id,document_id,document_version" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/client/documents");
  revalidatePath("/client/dashboard");
  revalidatePath("/client/community");
}

export async function switchPaymentSchedule(
  newSchedule: PaymentSchedule,
  formData: FormData
) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");
  if (me.payment_schedule === newSchedule) return;

  const signedName = String(formData.get("signed_name") ?? "").trim();
  if (!signedName) {
    throw new Error("Type your full legal name to confirm the switch.");
  }

  const supabase = await createClient();

  const documentKey =
    newSchedule === "monthly" ? "monthly_plan_terms" : "payg_plan_terms";

  const { data: doc, error: docError } = await supabase
    .from("legal_documents")
    .select("id, version")
    .eq("key", documentKey)
    .single();
  if (docError || !doc) throw new Error("Could not load the plan terms.");

  const { error: ackError } = await supabase
    .from("client_document_acknowledgments")
    .upsert(
      {
        client_id: me.id,
        document_id: doc.id,
        document_version: doc.version,
        signed_name: signedName,
      },
      { onConflict: "client_id,document_id,document_version" }
    );
  if (ackError) throw new Error(ackError.message);

  // Free-cancellation accounting carries across the switch, asymmetrically
  // -- see adjustFreeRemainingForSwitch. Only matters if there's an active
  // cycle (a late cancellation within the rolling window); otherwise
  // there's nothing banked to forfeit or protect.
  const windowCutoff = new Date();
  windowCutoff.setUTCDate(windowCutoff.getUTCDate() - LATE_CANCEL_WINDOW_DAYS);
  const { count: priorLateCancellationCount } = await supabase
    .from("session_occurrences")
    .select("id", { count: "exact", head: true })
    .eq("client_id", me.id)
    .eq("status", "late_cancelled")
    .gte("occurrence_date", windowCutoff.toISOString().slice(0, 10));

  const currentRemaining = effectiveFreeRemaining(
    me.late_cancel_free_remaining,
    (priorLateCancellationCount ?? 0) > 0,
    me.payment_schedule
  );
  const newRemaining = adjustFreeRemainingForSwitch(
    currentRemaining,
    me.payment_schedule,
    newSchedule
  );

  const { error } = await supabase
    .from("clients")
    .update({ payment_schedule: newSchedule, late_cancel_free_remaining: newRemaining })
    .eq("id", me.id);
  if (error) throw new Error(error.message);

  revalidatePath("/client/plan");
  revalidatePath("/client/dashboard");
}

function checked(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

function textOrNull(formData: FormData, name: string): string | null {
  const v = String(formData.get(name) ?? "").trim();
  return v || null;
}

function scaleOrNull(formData: FormData, name: string): number | null {
  const v = String(formData.get(name) ?? "").trim();
  return v ? Number(v) : null;
}

export async function submitClientIntake(formData: FormData) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();

  const painType = formData.getAll("pain_type").map(String);

  const { error } = await supabase.from("client_intake").upsert(
    {
      client_id: me.id,
      why_here: textOrNull(formData, "why_here"),
      why_worthwhile: textOrNull(formData, "why_worthwhile"),

      fall_past_year: checked(formData, "fall_past_year"),
      near_fall: checked(formData, "near_fall"),
      fear_of_falling: checked(formData, "fear_of_falling"),
      balance_notes: textOrNull(formData, "balance_notes"),

      osteoporosis: checked(formData, "osteoporosis"),
      joint_replacement: checked(formData, "joint_replacement"),
      arthritis: checked(formData, "arthritis"),
      hypermobility: checked(formData, "hypermobility"),
      pots_dysautonomia: checked(formData, "pots_dysautonomia"),
      mcas: checked(formData, "mcas"),
      autoimmune_condition: checked(formData, "autoimmune_condition"),
      bones_notes: textOrNull(formData, "bones_notes"),

      medications: textOrNull(formData, "medications"),
      doctor_name: textOrNull(formData, "doctor_name"),
      medical_clearance: textOrNull(formData, "medical_clearance"),

      lives_alone: checked(formData, "lives_alone"),
      drives_self: checked(formData, "drives_self"),
      stairs_daily: checked(formData, "stairs_daily"),
      day_to_day_notes: textOrNull(formData, "day_to_day_notes"),

      pain_location: textOrNull(formData, "pain_location"),
      pain_duration: textOrNull(formData, "pain_duration"),
      pain_better: textOrNull(formData, "pain_better"),
      pain_worse: textOrNull(formData, "pain_worse"),
      pain_type: painType.length > 0 ? painType : null,

      energy_scale: scaleOrNull(formData, "energy_scale"),
      sleep_scale: scaleOrNull(formData, "sleep_scale"),
      stress_scale: scaleOrNull(formData, "stress_scale"),
      confidence_scale: scaleOrNull(formData, "confidence_scale"),

      nutrition_relationship: textOrNull(formData, "nutrition_relationship"),
      nutrition_notes: textOrNull(formData, "nutrition_notes"),

      support_system: textOrNull(formData, "support_system"),
      competing_demands: textOrNull(formData, "competing_demands"),

      fitness_level: textOrNull(formData, "fitness_level"),
      body_satisfaction_scale: scaleOrNull(formData, "body_satisfaction_scale"),
      strong_areas: textOrNull(formData, "strong_areas"),
      injuries_limitations: textOrNull(formData, "injuries_limitations"),

      heart_condition: checked(formData, "heart_condition"),
      high_blood_pressure: checked(formData, "high_blood_pressure"),
      diabetes: checked(formData, "diabetes"),
      thyroid_condition: checked(formData, "thyroid_condition"),
      joint_issues: checked(formData, "joint_issues"),
      asthma: checked(formData, "asthma"),
      anxiety_depression: checked(formData, "anxiety_depression"),
      eating_disorder_history: checked(formData, "eating_disorder_history"),
      pregnancy_postpartum: checked(formData, "pregnancy_postpartum"),

      goal_change_description: textOrNull(formData, "goal_change_description"),
      goal_success_3_months: textOrNull(formData, "goal_success_3_months"),
      goal_held_back_before: textOrNull(formData, "goal_held_back_before"),
      goal_importance_scale: scaleOrNull(formData, "goal_importance_scale"),
      confidence_to_change_scale: scaleOrNull(
        formData,
        "confidence_to_change_scale"
      ),

      foods_loved: textOrNull(formData, "foods_loved"),
      foods_scary: textOrNull(formData, "foods_scary"),
      diet_history: textOrNull(formData, "diet_history"),
      food_stress_scale: scaleOrNull(formData, "food_stress_scale"),

      average_sleep_hours: textOrNull(formData, "average_sleep_hours"),
      sleep_duration_pattern: textOrNull(formData, "sleep_duration_pattern"),
      stress_sources: textOrNull(formData, "stress_sources"),
      stress_coping: textOrNull(formData, "stress_coping"),

      coaching_style: textOrNull(formData, "coaching_style"),
      feedback_style: textOrNull(formData, "feedback_style"),
      contact_method: textOrNull(formData, "contact_method"),
      checkin_frequency: textOrNull(formData, "checkin_frequency"),
      accountability_style: textOrNull(formData, "accountability_style"),
      past_coach_what_didnt_work: textOrNull(
        formData,
        "past_coach_what_didnt_work"
      ),

      anything_else: textOrNull(formData, "anything_else"),
      referral_source: textOrNull(formData, "referral_source"),

      submitted_at: new Date().toISOString(),
    },
    { onConflict: "client_id" }
  );

  if (error) throw new Error(error.message);

  // The Profile tab's primary/secondary goal fields are separate free-text
  // fields the coach fills in by hand -- nothing ever copied the intake's
  // own goal answers into them, so they stayed blank even after a client
  // filled out a full intake. Backfill only what's still empty, so this
  // never overwrites something the coach already wrote.
  const goalChangeDescription = textOrNull(formData, "goal_change_description");
  const goalSuccess3Months = textOrNull(formData, "goal_success_3_months");
  if (goalChangeDescription || goalSuccess3Months) {
    const { data: currentClient } = await supabase
      .from("clients")
      .select("primary_goal, secondary_goal")
      .eq("id", me.id)
      .single();

    const goalUpdate: Record<string, string> = {};
    if (!currentClient?.primary_goal && goalChangeDescription) {
      goalUpdate.primary_goal = goalChangeDescription;
    }
    if (!currentClient?.secondary_goal && goalSuccess3Months) {
      goalUpdate.secondary_goal = goalSuccess3Months;
    }
    if (Object.keys(goalUpdate).length > 0) {
      await supabase.from("clients").update(goalUpdate).eq("id", me.id);
    }
  }

  revalidatePath("/client/dashboard");
  redirect("/client/dashboard");
}

export async function submitClientProfile(formData: FormData) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();

  const textOrNull = (name: string) => {
    const v = String(formData.get(name) ?? "").trim();
    return v || null;
  };

  const name = textOrNull("name");
  if (!name) throw new Error("Name is required.");
  const timezone = textOrNull("timezone") ?? "America/Chicago";

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      preferred_name: textOrNull("preferred_name"),
      date_of_birth: textOrNull("date_of_birth"),
      phone: textOrNull("phone"),
      email: textOrNull("email"),
      emergency_contact_name: textOrNull("emergency_contact_name"),
      emergency_contact_phone: textOrNull("emergency_contact_phone"),
      physician_name: textOrNull("physician_name"),
      physician_phone: textOrNull("physician_phone"),
      timezone,
      profile_completed_at: me.profile_completed_at ?? new Date().toISOString(),
    })
    .eq("id", me.id);

  if (error) throw new Error(error.message);

  revalidatePath("/client/dashboard");
  redirect("/client/dashboard");
}

export async function submitMinorConsent(formData: FormData) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();

  const textOrNull = (name: string) => {
    const v = String(formData.get(name) ?? "").trim();
    return v || null;
  };

  const guardianSignature = textOrNull("guardian_signature_name");
  const consented = formData.get("consent") === "on";
  if (!consented || !guardianSignature) {
    throw new Error(
      "A parent/guardian must check the consent box and type their name to sign."
    );
  }

  const minorAgeRaw = textOrNull("minor_age");

  const { error } = await supabase.from("client_minor_consent").upsert(
    {
      client_id: me.id,
      minor_full_name: textOrNull("minor_full_name"),
      minor_date_of_birth: textOrNull("minor_date_of_birth"),
      minor_age: minorAgeRaw ? Number(minorAgeRaw) : null,
      minor_grade: textOrNull("minor_grade"),
      minor_sports: textOrNull("minor_sports"),
      guardian_full_name: textOrNull("guardian_full_name"),
      guardian_phone: textOrNull("guardian_phone"),
      guardian_email: textOrNull("guardian_email"),
      guardian_relationship: textOrNull("guardian_relationship"),
      guardian_update_preference: textOrNull("guardian_update_preference"),
      emergency_contact_name: textOrNull("emergency_contact_name"),
      emergency_contact_relationship: textOrNull("emergency_contact_relationship"),
      emergency_contact_phone: textOrNull("emergency_contact_phone"),
      physician_name: textOrNull("physician_name"),
      physician_phone: textOrNull("physician_phone"),
      diagnosis_treatment: textOrNull("diagnosis_treatment"),
      other_conditions_meds_allergies: textOrNull("other_conditions_meds_allergies"),
      athletic_training_clearance: textOrNull("athletic_training_clearance"),
      guardian_signature_name: guardianSignature,
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "client_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/client/documents");
  revalidatePath("/client/dashboard");
  revalidatePath("/client/minor-consent");
  redirect("/client/documents");
}

export async function setProgramExerciseSwap(
  programDayExerciseId: string,
  substituteExerciseId: string | null
) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();

  // The DB trigger enforces that substituteExerciseId can only ever be
  // this exercise's own designated regress_to/progress_to target (or
  // null, to revert to the prescribed movement) -- this isn't a free
  // swap to any exercise in the library.
  const { error } = await supabase.from("client_program_overrides").upsert(
    {
      client_id: me.id,
      program_day_exercise_id: programDayExerciseId,
      substitute_exercise_id: substituteExerciseId,
      edited_by: "client",
      active: substituteExerciseId !== null,
    },
    { onConflict: "client_id,program_day_exercise_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/client/program");
}

export async function logMyWorkout(programDayId: string, formData: FormData) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();

  const date = String(formData.get("date") ?? "");
  if (!date) throw new Error("Date is required.");
  const dayNotes = String(formData.get("day_notes") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const rating = ratingRaw ? Number(ratingRaw) : null;

  const sleep = String(formData.get("sleep") ?? "").trim();
  const water = String(formData.get("water") ?? "").trim();
  const food = String(formData.get("food") ?? "").trim();
  const energy = String(formData.get("energy") ?? "").trim();
  const mood = String(formData.get("mood") ?? "").trim();

  const { data: day } = await supabase
    .from("program_days")
    .select(
      "day_number, day_label, program_day_exercises(id, position, sets, reps, exercise_id, exercises(name))"
    )
    .eq("id", programDayId)
    .single();

  if (!day) throw new Error("Program day not found.");

  const { data: overrides } = await supabase
    .from("client_program_overrides")
    .select("program_day_exercise_id, substitute_exercise_id")
    .eq("client_id", me.id)
    .eq("active", true);

  const overrideMap = new Map(
    (overrides ?? []).map((o) => [o.program_day_exercise_id, o.substitute_exercise_id])
  );

  const substituteIds = [...overrideMap.values()].filter(
    (id): id is string => !!id
  );
  const { data: subs } = substituteIds.length
    ? await supabase.from("exercises").select("id, name").in("id", substituteIds)
    : { data: [] as { id: string; name: string }[] };
  const subNameById = new Map((subs ?? []).map((s) => [s.id, s.name]));

  type Pde = {
    id: string;
    position: number;
    sets: string | null;
    reps: string | null;
    exercise_id: string;
    exercises: { name: string } | null;
  };
  const pdes = ((day.program_day_exercises ?? []) as unknown as Pde[])
    .slice()
    .sort((a, b) => a.position - b.position);

  const entries = await Promise.all(
    pdes.map(async (pde) => {
      const substituteId = overrideMap.get(pde.id) ?? null;
      const effectiveName = substituteId
        ? subNameById.get(substituteId) ?? pde.exercises?.name ?? ""
        : pde.exercises?.name ?? "";
      const weight = String(formData.get(`weight_${pde.id}`) ?? "").trim();
      const notes = String(formData.get(`notes_${pde.id}`) ?? "").trim();

      let mediaPath: string | null = null;
      const file = formData.get(`file_${pde.id}`);
      if (file instanceof File && file.size > 0) {
        const path = `${me.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("form-checks")
          .upload(path, file, { contentType: file.type });
        if (uploadError) throw new Error(uploadError.message);
        mediaPath = path;
      }

      return {
        exercise: effectiveName,
        // Only ever differs from `exercise` when substituteId is set --
        // stored as a plain string (not re-derived from exercise_id at
        // render time) so an old log entry still reads correctly even if
        // the exercise is later renamed or removed from the library.
        prescribed_exercise: pde.exercises?.name ?? "",
        exercise_id: pde.exercise_id,
        substitute_exercise_id: substituteId,
        sets: pde.sets ?? "",
        reps: pde.reps ?? "",
        weight,
        notes,
        media_path: mediaPath,
      };
    })
  );

  // Auto-detected rather than asked -- coached if this date matches an
  // actual scheduled/confirmed time (recurring weekly slot, or a
  // one-off confirmed request), solo otherwise. No extra tap needed
  // logging a normal session, and a fully self-led client (no standing
  // schedule at all) correctly lands as solo every time.
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
  const { data: scheduleMatch } = await supabase
    .from("client_schedules")
    .select("id")
    .eq("client_id", me.id)
    .eq("day_of_week", dayOfWeek)
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  const { data: occurrenceMatch } = await supabase
    .from("session_occurrences")
    .select("id")
    .eq("client_id", me.id)
    .eq("occurrence_date", date)
    .in("status", ["scheduled", "completed"])
    .limit(1)
    .maybeSingle();
  const coached = !!(scheduleMatch || occurrenceMatch);

  const { error } = await supabase.from("sessions").insert({
    client_id: me.id,
    day_label: `Day ${day.day_number}: ${day.day_label}`,
    date,
    entries,
    rating,
    day_notes: dayNotes || null,
    logged_by: "client",
    coached,
  });

  if (error) throw new Error(error.message);

  // Captured in the same breath as the workout rating on purpose -- the
  // point is to let the client (and coach) see the connection between how
  // the week outside the gym went and how the session itself felt/went.
  if (sleep || water || food || energy || mood) {
    const { error: checkinError } = await supabase.from("checkins").insert({
      client_id: me.id,
      date,
      sleep: sleep || null,
      water: water || null,
      food: food || null,
      energy: energy || null,
      mood: mood || null,
      logged_by: "client",
    });
    if (checkinError) throw new Error(checkinError.message);
  }

  // Same as when the coach logs a session -- a logged workout means that
  // date's occurrence was attended, feeding the existing attendance/risk
  // tracking. Doesn't overwrite an already-completed row (the trigger
  // blocks that) and never touches cancelled/late_cancelled history.
  await supabase.from("session_occurrences").upsert(
    { client_id: me.id, occurrence_date: date, status: "completed" },
    { onConflict: "client_id,occurrence_date" }
  );

  revalidatePath("/client/program");
  revalidatePath("/client/dashboard");
}

export async function addHabit(name: string) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");
  const trimmed = name.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_habits")
    .insert({ client_id: me.id, name: trimmed });
  if (error) throw new Error(error.message);

  revalidatePath("/client/habits");
}

export async function deleteHabit(habitId: string) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_habits")
    .delete()
    .eq("id", habitId)
    .eq("client_id", me.id);
  if (error) throw new Error(error.message);

  revalidatePath("/client/habits");
}

// Cycles a day-box through empty -> level 1 (teal) -> level 2 (gold) ->
// level 3 (pink) -> empty. A single click target is simpler here than a
// color-swatch picker given the app has no client-side interactivity to
// pop one open, and the cycle is short enough to tap through.
export async function cycleHabitLog(habitId: string, logDate: string) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("client_habit_logs")
    .select("id, level")
    .eq("habit_id", habitId)
    .eq("log_date", logDate)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase
      .from("client_habit_logs")
      .insert({ habit_id: habitId, client_id: me.id, log_date: logDate, level: 1 });
    if (error) throw new Error(error.message);
  } else if (existing.level >= 3) {
    const { error } = await supabase
      .from("client_habit_logs")
      .delete()
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("client_habit_logs")
      .update({ level: existing.level + 1 })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/client/habits");
}

export async function addSymptomLog(formData: FormData) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const logDate = String(formData.get("log_date") ?? "");
  const symptom = String(formData.get("symptom") ?? "").trim();
  const severityRaw = String(formData.get("severity") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const sharedWithCoach = formData.get("shared_with_coach") === "on";

  if (!logDate || !symptom) throw new Error("Date and symptom are required.");

  const supabase = await createClient();
  const { error } = await supabase.from("client_symptom_logs").insert({
    client_id: me.id,
    log_date: logDate,
    symptom,
    severity: severityRaw ? Number(severityRaw) : null,
    notes: notes || null,
    shared_with_coach: sharedWithCoach,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/client/symptoms");
}

export async function deleteSymptomLog(logId: string) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_symptom_logs")
    .delete()
    .eq("id", logId)
    .eq("client_id", me.id);
  if (error) throw new Error(error.message);

  revalidatePath("/client/symptoms");
}

export async function addNutritionLog(formData: FormData) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const logDate = String(formData.get("log_date") ?? "");
  if (!logDate) throw new Error("Date is required.");

  const numOrNull = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim();
    return raw ? Number(raw) : null;
  };
  // hunger_before/fullness_after/satisfaction have a check constraint
  // (1-10, 1-10, 1-5) -- the form's min/max attributes are only a
  // suggestion to the browser, not something it always enforces (pasted
  // values, some mobile keyboards, autofill), so an out-of-range number
  // reaching the insert below would violate the constraint and crash
  // instead of saving. Clamp into range rather than trust the browser.
  const clampedIntOrNull = (key: string, min: number, max: number) => {
    const n = numOrNull(key);
    if (n === null || !Number.isFinite(n)) return null;
    return Math.min(max, Math.max(min, Math.round(n)));
  };
  const textOrNull = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim();
    return raw || null;
  };

  const supabase = await createClient();

  let photoPath: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const path = `${me.id}/nutrition-${crypto.randomUUID()}-${safeFileName(photo.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("form-checks")
      .upload(path, photo, { contentType: photo.type });
    if (uploadError) throw new Error(uploadError.message);
    photoPath = path;
  }

  const { error } = await supabase.from("client_nutrition_logs").insert({
    client_id: me.id,
    log_date: logDate,
    meal_label: textOrNull("meal_label"),
    description: textOrNull("description"),
    hunger_before: clampedIntOrNull("hunger_before", 1, 10),
    fullness_after: clampedIntOrNull("fullness_after", 1, 10),
    satisfaction: clampedIntOrNull("satisfaction", 1, 5),
    calories: numOrNull("calories"),
    protein_g: numOrNull("protein_g"),
    carbs_g: numOrNull("carbs_g"),
    fat_g: numOrNull("fat_g"),
    notes: textOrNull("notes"),
    photo_path: photoPath,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/client/nutrition");
}

export async function deleteNutritionLog(logId: string) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_nutrition_logs")
    .delete()
    .eq("id", logId)
    .eq("client_id", me.id);
  if (error) throw new Error(error.message);

  revalidatePath("/client/nutrition");
}
