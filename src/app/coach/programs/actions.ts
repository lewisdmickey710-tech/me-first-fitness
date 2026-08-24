"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function uploadCareProfilePacket(
  careProfileId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const file = formData.get("packet");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("A PDF file is required.");
  }

  const path = `${careProfileId}/phase1-${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("packets")
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase
    .from("care_profiles")
    .update({ phase1_packet_path: path })
    .eq("id", careProfileId);
  if (error) throw new Error(error.message);

  revalidatePath(`/coach/programs/${careProfileId}`);
}

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

  const exerciseIds = formData.getAll("exercise_id") as string[];
  const setsList = formData.getAll("sets") as string[];
  const repsList = formData.getAll("reps") as string[];
  const tempoList = formData.getAll("tempo") as string[];
  const supersetList = formData.getAll("superset_group") as string[];

  const rows = exerciseIds
    .map((exercise_id, i) => ({
      program_day_id: programDayId,
      exercise_id,
      position: i,
      sets: setsList[i]?.trim() || null,
      reps: repsList[i]?.trim() || null,
      tempo: tempoList[i]?.trim() || null,
      superset_group: supersetList[i]?.trim() || null,
    }))
    .filter((r) => r.exercise_id);

  // Upsert by (day, slot) instead of delete-then-reinsert, so a slot that
  // still holds an exercise keeps its id across saves -- and with it, any
  // client_program_overrides pointed at that id. Only slots that are now
  // blank or beyond the new row count get deleted (which correctly cascades
  // any override for a slot that no longer exists).
  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from("program_day_exercises")
      .upsert(rows, { onConflict: "program_day_id,position" });
    if (upsertError) throw new Error(upsertError.message);
  }

  const filledPositions = rows.map((r) => r.position);
  let staleQuery = supabase
    .from("program_day_exercises")
    .delete()
    .eq("program_day_id", programDayId);
  staleQuery =
    filledPositions.length > 0
      ? staleQuery.not("position", "in", `(${filledPositions.join(",")})`)
      : staleQuery;
  const { error: delError } = await staleQuery;
  if (delError) throw new Error(delError.message);

  revalidatePath(`/coach/programs/${careProfileId}`);
}
