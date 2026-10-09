"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { blockOneCoachDate } from "@/app/coach/actions";
import { safeFileName } from "@/lib/storage";
import type { CoachEventKind } from "@/lib/types";

const KIND_LABEL: Record<CoachEventKind, string> = {
  class: "Group class",
  workshop: "Workshop",
};

function revalidateEventPaths() {
  revalidatePath("/coach/classes");
  revalidatePath("/coach/schedule");
  revalidatePath("/coach/availability");
  revalidatePath("/client/schedule");
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient();

  const kindRaw = String(formData.get("kind") ?? "");
  const kind: CoachEventKind = kindRaw === "workshop" ? "workshop" : "class";
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const event_date = String(formData.get("event_date") ?? "").trim();
  const start_time = String(formData.get("start_time") ?? "").trim();
  const end_time = String(formData.get("end_time") ?? "").trim();

  if (!title) throw new Error("Title is required.");
  if (!event_date) throw new Error("Date is required.");
  if (!start_time || !end_time) throw new Error("Start and end time are required.");
  if (end_time <= start_time) throw new Error("End time must be after start time.");

  const blockedId = await blockOneCoachDate(supabase, {
    date: event_date,
    reason: `${KIND_LABEL[kind]}: ${title}`,
    start_time,
    end_time,
  });

  let pdf_path: string | null = null;
  const file = formData.get("pdf");
  if (file instanceof File && file.size > 0) {
    pdf_path = `${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("class-pdfs")
      .upload(pdf_path, file, { contentType: file.type });
    if (uploadError) throw new Error(uploadError.message);
  }

  const { error } = await supabase.from("coach_events").insert({
    kind,
    title,
    description,
    event_date,
    start_time,
    end_time,
    pdf_path,
    blocked_date_id: blockedId,
  });
  if (error) throw new Error(error.message);

  revalidateEventPaths();
}

export async function setEventVisibility(eventId: string, visible: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("coach_events")
    .update({ visible_to_clients: visible })
    .eq("id", eventId);
  if (error) throw new Error(error.message);

  revalidateEventPaths();
}

export async function replaceEventPdf(eventId: string, formData: FormData) {
  const supabase = await createClient();

  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("A PDF file is required.");
  }

  const { data: event, error: fetchError } = await supabase
    .from("coach_events")
    .select("pdf_path")
    .eq("id", eventId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const pdf_path = `${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("class-pdfs")
    .upload(pdf_path, file, { contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase
    .from("coach_events")
    .update({ pdf_path })
    .eq("id", eventId);
  if (error) throw new Error(error.message);

  if (event?.pdf_path) {
    await supabase.storage.from("class-pdfs").remove([event.pdf_path]);
  }

  revalidateEventPaths();
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient();

  const { data: event, error: fetchError } = await supabase
    .from("coach_events")
    .select("pdf_path, blocked_date_id")
    .eq("id", eventId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { error } = await supabase.from("coach_events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);

  if (event?.blocked_date_id) {
    await supabase.from("coach_blocked_dates").delete().eq("id", event.blocked_date_id);
  }
  if (event?.pdf_path) {
    await supabase.storage.from("class-pdfs").remove([event.pdf_path]);
  }

  revalidateEventPaths();
}
