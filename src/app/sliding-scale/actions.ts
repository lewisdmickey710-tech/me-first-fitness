"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function submitSlidingScaleApplication(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const situation = String(formData.get("situation") ?? "").trim();
  const whatWouldWork = String(formData.get("what_would_work") ?? "").trim();

  if (!name || !email || !situation || !whatWouldWork) {
    redirect(
      `/sliding-scale?error=${encodeURIComponent(
        "Name, email, and both questions below are required."
      )}`
    );
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("sliding_scale_applications").insert({
      name,
      email,
      phone: phone || null,
      situation,
      what_would_work: whatWouldWork,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    redirect(`/sliding-scale?error=${encodeURIComponent(message)}`);
  }

  redirect("/sliding-scale/sent");
}
