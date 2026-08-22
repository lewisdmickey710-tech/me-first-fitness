"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveProgramDay(
  careProfileId: string,
  phase: string,
  dayNumber: number,
  formData: FormData
) {
  const supabase = await createClient();

  const day_label = String(formData.get("day_label") ?? "").trim();
  if (!day_label) throw new Error("Day label is required.");

  const { data: day, error: dayError } = await supabase
    .from("program_days")
    .upsert(
      {
        care_profile_id: careProfileId,
        phase,
        day_number: dayNumber,
        day_label,
      },
      { onConflict: "care_profile_id,phase,day_number" }
    )
    .select("id")
    .single();

  if (dayError) throw new Error(dayError.message);

  const programDayId = day.id;

  const { error: delError } = await supabase
    .from("program_day_exercises")
    .delete()
    .eq("program_day_id", programDayId);

  if (delError) throw new Error(delError.message);

  const exerciseIds = formData.getAll("exercise_id") as string[];
  const setsList = formData.getAll("sets") as string[];
  const repsList = formData.getAll("reps") as string[];
  const supersetList = formData.getAll("superset_group") as string[];

  const rows = exerciseIds
    .map((exercise_id, i) => ({
      program_day_id: programDayId,
      exercise_id,
      position: i,
      sets: setsList[i]?.trim() || null,
      reps: repsList[i]?.trim() || null,
      superset_group: supersetList[i]?.trim() || null,
    }))
    .filter((r) => r.exercise_id);

  if (rows.length > 0) {
    const { error: insError } = await supabase
      .from("program_day_exercises")
      .insert(rows);
    if (insError) throw new Error(insError.message);
  }

  revalidatePath(`/coach/programs/${careProfileId}`);
}
