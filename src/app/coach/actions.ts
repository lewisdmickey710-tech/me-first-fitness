"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RequestStatus, SessionEntry } from "@/lib/types";

export async function addClient(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const track = String(formData.get("track") ?? "");
  const phase = String(formData.get("phase") ?? "n/a");
  const sessionsAllottedRaw = String(formData.get("sessions_allotted") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || !track) {
    throw new Error("Name and track are required.");
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      track,
      phase,
      sessions_allotted: sessionsAllottedRaw
        ? Number(sessionsAllottedRaw)
        : null,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/coach/roster");
  redirect(`/coach/clients/${data.id}`);
}

export async function setRequestStatus(
  requestId: string,
  clientId: string,
  status: RequestStatus
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("requests")
    .update({ status })
    .eq("id", requestId);

  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
  revalidatePath("/coach/roster");
}

export async function logSession(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const day_label = String(formData.get("day_label") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const ratingRaw = String(formData.get("rating") ?? "");
  const day_notes = String(formData.get("day_notes") ?? "").trim();

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

  const { error } = await supabase.from("sessions").insert({
    client_id: clientId,
    day_label,
    date,
    entries,
    rating: ratingRaw ? Number(ratingRaw) : null,
    day_notes: day_notes || null,
    logged_by: "coach",
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
  redirect(`/coach/clients/${clientId}?tab=sessions`);
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

export async function updateClient(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const track = String(formData.get("track") ?? "");
  const phase = String(formData.get("phase") ?? "n/a");
  const sessionsAllottedRaw = String(formData.get("sessions_allotted") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      track,
      phase,
      sessions_allotted: sessionsAllottedRaw
        ? Number(sessionsAllottedRaw)
        : null,
      notes: notes || null,
    })
    .eq("id", clientId);

  if (error) throw new Error(error.message);

  revalidatePath(`/coach/clients/${clientId}`);
}
