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
    { onConflict: "lead_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/lead/dashboard");
  redirect("/lead/dashboard");
}
