"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RequestStatus } from "@/lib/types";

export async function setLeadRequestStatus(
  requestId: string,
  leadId: string,
  status: RequestStatus
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("lead_assessment_requests")
    .update({ status })
    .eq("id", requestId);

  if (error) throw new Error(error.message);

  revalidatePath(`/coach/leads/${leadId}`);
}

const MOVEMENTS = [
  "squat",
  "deadlift_hinge",
  "lunge",
  "push_up",
  "plank",
  "row",
] as const;

export async function addMovementScreening(leadId: string, formData: FormData) {
  const supabase = await createClient();

  const date = String(formData.get("date") ?? "");
  const modifications = String(
    formData.get("modifications_observations") ?? ""
  ).trim();
  const coachNotes = String(formData.get("coach_notes") ?? "").trim();

  if (!date) throw new Error("Date is required.");

  const { data: screening, error: screeningError } = await supabase
    .from("lead_movement_screenings")
    .insert({
      lead_id: leadId,
      date,
      modifications_observations: modifications || null,
      coach_notes: coachNotes || null,
    })
    .select("id")
    .single();

  if (screeningError) throw new Error(screeningError.message);

  const results = MOVEMENTS.map((movement) => {
    const score = String(formData.get(`${movement}_score`) ?? "");
    const pain = formData.get(`${movement}_pain`) === "on";
    const plan = String(formData.get(`${movement}_plan`) ?? "");
    const notes = String(formData.get(`${movement}_notes`) ?? "").trim();
    return {
      screening_id: screening.id,
      movement,
      score: score ? Number(score) : null,
      pain,
      plan: plan || null,
      notes: notes || null,
    };
  });

  const { error: resultsError } = await supabase
    .from("lead_movement_screening_results")
    .insert(results);

  if (resultsError) throw new Error(resultsError.message);

  revalidatePath(`/coach/leads/${leadId}`);
  redirect(`/coach/leads/${leadId}`);
}

export async function convertLeadToClient(leadId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) throw new Error("Lead not found.");

  const care_profile_id = String(formData.get("care_profile_id") ?? "");
  const days_per_week = String(formData.get("days_per_week") ?? "");
  const session_mode = String(formData.get("session_mode") ?? "");
  const sessionsAllottedRaw = String(formData.get("sessions_allotted") ?? "");

  if (!care_profile_id) throw new Error("Care profile is required.");

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: lead.name,
      user_id: lead.user_id,
      care_profile_id,
      days_per_week: days_per_week ? Number(days_per_week) : null,
      session_mode: session_mode || null,
      sessions_allotted: sessionsAllottedRaw
        ? Number(sessionsAllottedRaw)
        : null,
    })
    .select("id")
    .single();

  if (clientError) throw new Error(clientError.message);

  const { error: phaseError } = await supabase
    .from("client_phase_history")
    .insert({
      client_id: client.id,
      cycle_number: 1,
      phase: "1",
      started_on: new Date().toISOString().slice(0, 10),
      planned_weeks: 4,
    });

  if (phaseError) throw new Error(phaseError.message);

  const { error: leadUpdateError } = await supabase
    .from("leads")
    .update({ status: "converted", converted_client_id: client.id })
    .eq("id", leadId);

  if (leadUpdateError) throw new Error(leadUpdateError.message);

  // Flip the linked login from lead to client -- profiles has no coach-write
  // RLS policy (by design, it's sensitive), so this needs the admin client.
  if (lead.user_id) {
    const admin = createAdminClient();
    const { error: roleError } = await admin
      .from("profiles")
      .update({ role: "client" })
      .eq("id", lead.user_id);
    if (roleError) throw new Error(roleError.message);
  }

  revalidatePath("/coach/leads");
  revalidatePath("/coach/roster");
  redirect(`/coach/clients/${client.id}`);
}

export async function archiveLead(leadId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({ status: "archived" })
    .eq("id", leadId);

  if (error) throw new Error(error.message);

  revalidatePath("/coach/leads");
  redirect("/coach/leads");
}
