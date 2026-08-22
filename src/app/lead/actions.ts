"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyLead } from "@/lib/current-lead";

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

export async function submitLeadIntake(formData: FormData) {
  const lead = await getMyLead();
  if (!lead) throw new Error("No linked lead profile found.");

  const supabase = await createClient();

  const painType = formData.getAll("pain_type").map(String);

  const { error } = await supabase.from("lead_intake").upsert(
    {
      lead_id: lead.id,
      date_of_birth: textOrNull(formData, "date_of_birth"),
      why_here: textOrNull(formData, "why_here"),
      why_worthwhile: textOrNull(formData, "why_worthwhile"),

      fall_past_year: checked(formData, "fall_past_year"),
      near_fall: checked(formData, "near_fall"),
      fear_of_falling: checked(formData, "fear_of_falling"),
      balance_notes: textOrNull(formData, "balance_notes"),

      osteoporosis: checked(formData, "osteoporosis"),
      joint_replacement: checked(formData, "joint_replacement"),
      arthritis: checked(formData, "arthritis"),
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

      submitted_at: new Date().toISOString(),
    },
    { onConflict: "lead_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/lead/dashboard");
  redirect("/lead/dashboard");
}
