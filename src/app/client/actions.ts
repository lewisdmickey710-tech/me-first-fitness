"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";

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

  const { error } = await supabase.from("activities").insert({
    client_id: me.id,
    date,
    type,
    duration: duration || null,
    notes: notes || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/client/dashboard");
  redirect("/client/dashboard");
}

export async function submitRequest(formData: FormData) {
  const me = await getMyClient();
  if (!me) throw new Error("No linked client profile found.");

  const supabase = await createClient();

  const preferred_date = String(formData.get("preferred_date") ?? "");
  const preferred_time = String(formData.get("preferred_time") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!preferred_date) throw new Error("Preferred date is required.");

  const { error } = await supabase.from("requests").insert({
    client_id: me.id,
    preferred_date,
    preferred_time: preferred_time || null,
    note: note || null,
    status: "pending",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/client/dashboard");
  redirect("/client/dashboard");
}
