"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function cleanText(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

export async function addExercise(formData: FormData) {
  const supabase = await createClient();

  const name = cleanText(formData.get("name"));
  if (!name) throw new Error("Name is required.");

  const regress_to_id = cleanText(formData.get("regress_to_id"));
  const progress_to_id = cleanText(formData.get("progress_to_id"));

  const { error } = await supabase.from("exercises").insert({
    name,
    client_description: cleanText(formData.get("client_description")),
    coach_cues: cleanText(formData.get("coach_cues")),
    regress_to_id: regress_to_id || null,
    progress_to_id: progress_to_id || null,
    primary_muscle_group: cleanText(formData.get("primary_muscle_group")),
    movement_type: cleanText(formData.get("movement_type")),
    laterality: cleanText(formData.get("laterality")),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/coach/library");
  redirect("/coach/library");
}

export async function updateExercise(exerciseId: string, formData: FormData) {
  const supabase = await createClient();

  const name = cleanText(formData.get("name"));
  if (!name) throw new Error("Name is required.");

  const regress_to_id = cleanText(formData.get("regress_to_id"));
  const progress_to_id = cleanText(formData.get("progress_to_id"));

  const { error } = await supabase
    .from("exercises")
    .update({
      name,
      client_description: cleanText(formData.get("client_description")),
      coach_cues: cleanText(formData.get("coach_cues")),
      regress_to_id: regress_to_id || null,
      progress_to_id: progress_to_id || null,
      primary_muscle_group: cleanText(formData.get("primary_muscle_group")),
      movement_type: cleanText(formData.get("movement_type")),
      laterality: cleanText(formData.get("laterality")),
    })
    .eq("id", exerciseId);

  if (error) throw new Error(error.message);

  revalidatePath("/coach/library");
  redirect("/coach/library");
}
