"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeFileName } from "@/lib/storage";

export async function uploadCareProfilePacket(
  careProfileId: string,
  phase: string,
  formData: FormData
) {
  const supabase = await createClient();

  const file = formData.get("packet");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("A PDF file is required.");
  }

  const path = `${careProfileId}/phase${phase}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("packets")
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase.from("care_profile_packets").upsert(
    { care_profile_id: careProfileId, phase, storage_path: path },
    { onConflict: "care_profile_id,phase" }
  );
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

  const pdeIds = formData.getAll("pde_id") as string[];
  const exerciseIds = formData.getAll("exercise_id") as string[];
  const setsList = formData.getAll("sets") as string[];
  const repsList = formData.getAll("reps") as string[];
  const tempoList = formData.getAll("tempo") as string[];
  const supersetList = formData.getAll("superset_group") as string[];

  // Each form row carries its existing row's real id as a hidden field --
  // that id is this exercise's actual identity now, not its position in
  // the list. Position alone used to double as identity (upsert by
  // (day, position)), so removing a row from the middle or reordering
  // would silently hand that slot's id -- and any client_program_overrides
  // pointed at it -- to whatever different exercise ended up in that slot
  // after the shift, instead of actually deleting/moving anything.
  const filledRows = exerciseIds
    .map((exercise_id, i) => ({
      pde_id: pdeIds[i] || null,
      exercise_id,
      position: i,
      sets: setsList[i]?.trim() || null,
      reps: repsList[i]?.trim() || null,
      tempo: tempoList[i]?.trim() || null,
      superset_group: supersetList[i]?.trim() || null,
    }))
    .filter((r) => r.exercise_id);

  const keptIds = new Set(
    filledRows.filter((r) => r.pde_id).map((r) => r.pde_id!)
  );

  // Delete rows for exercises no longer in the list first -- this always
  // correctly cascades any override for an exercise that's genuinely
  // gone, and frees up positions before the reassignment below.
  const { data: existingIds } = await supabase
    .from("program_day_exercises")
    .select("id")
    .eq("program_day_id", programDayId);
  const toDelete = (existingIds ?? [])
    .map((r) => r.id)
    .filter((id) => !keptIds.has(id));
  if (toDelete.length > 0) {
    const { error: delError } = await supabase
      .from("program_day_exercises")
      .delete()
      .in("id", toDelete);
    if (delError) throw new Error(delError.message);
  }

  const existingRows = filledRows.filter((r) => r.pde_id);
  const newRows = filledRows.filter((r) => !r.pde_id);

  // Two-phase position write for rows that already exist: the
  // (program_day_id, position) unique constraint is checked immediately
  // on each update, not deferred, so swapping two rows' positions
  // directly would reject the first one to move into an still-occupied
  // spot. Parking every row at a distinct negative position first makes
  // a collision impossible in either pass.
  for (let i = 0; i < existingRows.length; i++) {
    const { error } = await supabase
      .from("program_day_exercises")
      .update({ position: -(i + 1) })
      .eq("id", existingRows[i].pde_id!);
    if (error) throw new Error(error.message);
  }
  for (const r of existingRows) {
    const { error } = await supabase
      .from("program_day_exercises")
      .update({
        exercise_id: r.exercise_id,
        position: r.position,
        sets: r.sets,
        reps: r.reps,
        tempo: r.tempo,
        superset_group: r.superset_group,
      })
      .eq("id", r.pde_id!);
    if (error) throw new Error(error.message);
  }

  if (newRows.length > 0) {
    const { error } = await supabase.from("program_day_exercises").insert(
      newRows.map((r) => ({
        program_day_id: programDayId,
        exercise_id: r.exercise_id,
        position: r.position,
        sets: r.sets,
        reps: r.reps,
        tempo: r.tempo,
        superset_group: r.superset_group,
      }))
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/coach/programs/${careProfileId}`);
}
