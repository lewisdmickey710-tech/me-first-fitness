"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function approveSlidingScaleApplication(
  applicationId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const rateRaw = String(formData.get("approved_rate") ?? "");
  const coachNotes = String(formData.get("coach_notes") ?? "").trim();

  if (!rateRaw) throw new Error("Set the rate you're approving them for.");

  const { error } = await supabase
    .from("sliding_scale_applications")
    .update({
      status: "approved",
      approved_rate: Number(rateRaw),
      coach_notes: coachNotes || null,
      decided_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (error) throw new Error(error.message);

  revalidatePath("/coach/sliding-scale");
}

export async function declineSlidingScaleApplication(
  applicationId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const coachNotes = String(formData.get("coach_notes") ?? "").trim();

  const { error } = await supabase
    .from("sliding_scale_applications")
    .update({
      status: "declined",
      coach_notes: coachNotes || null,
      decided_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (error) throw new Error(error.message);

  revalidatePath("/coach/sliding-scale");
}
