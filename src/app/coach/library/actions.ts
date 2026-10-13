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
    movement_pattern: cleanText(formData.get("movement_pattern")),
    plane_of_motion: cleanText(formData.get("plane_of_motion")),
    video_url: cleanText(formData.get("video_url")),
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
      movement_pattern: cleanText(formData.get("movement_pattern")),
      plane_of_motion: cleanText(formData.get("plane_of_motion")),
      video_url: cleanText(formData.get("video_url")),
    })
    .eq("id", exerciseId);

  if (error) throw new Error(error.message);

  revalidatePath("/coach/library");
  redirect("/coach/library");
}

// Applies one or more tag fields to many exercises at once -- the main
// way the ~1,340-exercise library (mostly bulk-imported with no metadata)
// actually gets categorized, since tagging one at a time in the edit form
// isn't realistic at that volume. Only fields present in `fields` are
// touched; filter the list down (search/filters in the Library UI), select
// the ones that share a tag, and apply it in one call.
export async function bulkTagExercises(
  ids: string[],
  fields: {
    primary_muscle_group?: string | null;
    movement_type?: string | null;
    laterality?: string | null;
    movement_pattern?: string | null;
    plane_of_motion?: string | null;
  }
) {
  if (ids.length === 0) return;

  const patch: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) patch[key] = value || null;
  }
  if (Object.keys(patch).length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.from("exercises").update(patch).in("id", ids);
  if (error) throw new Error(error.message);

  revalidatePath("/coach/library");
}
