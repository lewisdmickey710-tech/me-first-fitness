import type { createClient } from "@/lib/supabase/server";
import type { Client, SessionEntry } from "@/lib/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

function humanize(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Generic "Field Name: value" dump of a row's own columns -- used for the
 * intake questionnaire and minor consent, which have dozens of fields
 * that would otherwise need hand-listing (and silently drift out of date
 * every time a field is added). Skips empty/false/id/timestamp columns
 * so the output only shows what was actually filled in. */
function dumpFields(
  row: Record<string, unknown> | null,
  skip: string[] = ["id", "client_id", "created_at", "updated_at"]
): string {
  if (!row) return "  (none on file)";
  const lines = Object.entries(row)
    .filter(([k, v]) => !skip.includes(k) && v !== null && v !== "" && v !== false)
    .map(([k, v]) => `  ${humanize(k)}: ${Array.isArray(v) ? v.join(", ") : v}`);
  return lines.length > 0 ? lines.join("\n") : "  (none on file)";
}

function section(title: string, body: string): string {
  return `\n${title}\n${"=".repeat(title.length)}\n${body.trim() || "  (nothing recorded)"}\n`;
}

/**
 * Builds a full plain-text export of everything tracked for one client --
 * profile info, intake, measurements, sessions, check-ins, habits,
 * nutrition, symptoms, service check-ins, milestones, payments,
 * attendance history, signed documents, and their own community posts.
 * Runs under whichever Supabase session is passed in (a client's own, or
 * the coach's) -- RLS scopes every query correctly either way, so this
 * works unmodified for both the client's self-serve download and the
 * coach pulling a copy before archiving someone.
 *
 * Photos (progress photos, nutrition photos, form-check media) are
 * listed by date/note but not embedded -- this is a text export, not a
 * zip archive, so image bytes aren't included.
 */
export async function buildClientExportText(
  supabase: Supabase,
  clientId: string
): Promise<string | null> {
  const { data: client } = (await supabase
    .from("clients")
    .select("*, care_profiles(name)")
    .eq("id", clientId)
    .maybeSingle()) as { data: (Client & { care_profiles: { name: string } | null }) | null };

  if (!client) return null;

  const [
    { data: intake },
    { data: minorConsent },
    { data: measurements },
    { data: progressPhotos },
    { data: sessions },
    { data: checkins },
    { data: activities },
    { data: habits },
    { data: nutritionLogs },
    { data: symptomLogs },
    { data: serviceCheckins },
    { data: milestones },
    { data: payments },
    { data: occurrences },
    { data: acks },
    { data: communityPosts },
    { data: communityComments },
  ] = await Promise.all([
    supabase.from("client_intake").select("*").eq("client_id", clientId).maybeSingle(),
    supabase.from("client_minor_consent").select("*").eq("client_id", clientId).maybeSingle(),
    supabase.from("measurements").select("*").eq("client_id", clientId).order("date"),
    supabase
      .from("client_progress_photos")
      .select("date, angle, notes")
      .eq("client_id", clientId)
      .order("date"),
    supabase.from("sessions").select("*").eq("client_id", clientId).order("date"),
    supabase.from("checkins").select("*").eq("client_id", clientId).order("date"),
    supabase.from("activities").select("*").eq("client_id", clientId).order("date"),
    supabase.from("client_habits").select("*").eq("client_id", clientId).order("created_at"),
    supabase
      .from("client_nutrition_logs")
      .select("*")
      .eq("client_id", clientId)
      .order("log_date"),
    supabase
      .from("client_symptom_day_logs")
      .select("*, client_symptoms(name)")
      .eq("client_id", clientId)
      .order("log_date"),
    supabase.from("service_checkins").select("*").eq("client_id", clientId).order("date"),
    supabase
      .from("client_milestones")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at"),
    supabase.from("payments").select("*").eq("client_id", clientId).order("due_date"),
    supabase
      .from("session_occurrences")
      .select("*")
      .eq("client_id", clientId)
      .order("occurrence_date"),
    supabase
      .from("client_document_acknowledgments")
      .select("*, legal_documents(title)")
      .eq("client_id", clientId)
      .order("acknowledged_at"),
    supabase
      .from("community_posts")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at"),
    supabase
      .from("community_post_comments")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at"),
  ]);

  const lines: string[] = [];
  lines.push(`MeFirstFitness — Data Export for ${client.name}`);
  lines.push(`Generated ${new Date().toISOString().slice(0, 10)}`);
  lines.push(
    "\nThis is a full export of everything tracked in the app for this client, for their own records."
  );

  lines.push(
    section(
      "PROFILE",
      dumpFields({
        name: client.name,
        preferred_name: client.preferred_name,
        date_of_birth: client.date_of_birth,
        phone: client.phone,
        email: client.email,
        emergency_contact_name: client.emergency_contact_name,
        emergency_contact_phone: client.emergency_contact_phone,
        physician_name: client.physician_name,
        physician_phone: client.physician_phone,
        care_track: client.care_profiles?.name ?? null,
        start_date: client.start_date,
        session_mode: client.session_mode,
        payment_schedule: client.payment_schedule,
        primary_goal: client.primary_goal,
        secondary_goal: client.secondary_goal,
        key_health_notes: client.key_health_notes,
      })
    )
  );

  lines.push(section("INTAKE QUESTIONNAIRE", dumpFields(intake)));
  if (minorConsent) {
    lines.push(section("MINOR CONSENT & INTAKE ADDENDUM", dumpFields(minorConsent)));
  }

  lines.push(
    section(
      "MEASUREMENTS",
      (measurements ?? [])
        .map((m) =>
          [
            `${m.date}:`,
            m.weight ? `weight ${m.weight}lb` : null,
            m.waist ? `waist ${m.waist}in` : null,
            m.chest ? `chest ${m.chest}in` : null,
            m.hips ? `hips ${m.hips}in` : null,
            m.notes ? `— ${m.notes}` : null,
          ]
            .filter(Boolean)
            .join(" ")
        )
        .join("\n")
    )
  );

  lines.push(
    section(
      "PROGRESS PHOTOS (images not included in this export)",
      (progressPhotos ?? [])
        .map((p) => `${p.date}${p.angle ? ` (${p.angle})` : ""}${p.notes ? ` — ${p.notes}` : ""}`)
        .join("\n")
    )
  );

  lines.push(
    section(
      "LOGGED WORKOUTS",
      (sessions ?? [])
        .map((s) => {
          const entries = (s.entries as SessionEntry[]) ?? [];
          const entryLines = entries
            .map(
              (e) =>
                `    - ${e.exercise}: ${e.sets}x${e.reps}${e.weight ? ` @ ${e.weight}` : ""}${e.notes ? ` — ${e.notes}` : ""}`
            )
            .join("\n");
          return [
            `${s.date} — ${s.day_label}${s.rating ? ` (rated ${s.rating}/5)` : ""}`,
            entryLines,
            s.day_notes ? `  Notes: ${s.day_notes}` : null,
          ]
            .filter(Boolean)
            .join("\n");
        })
        .join("\n\n")
    )
  );

  lines.push(
    section(
      "DAILY CHECK-INS",
      (checkins ?? [])
        .map((c) =>
          [
            `${c.date}:`,
            c.sleep ? `sleep ${c.sleep}` : null,
            c.water ? `water ${c.water}` : null,
            c.food ? `food ${c.food}` : null,
            c.energy ? `energy ${c.energy}` : null,
            c.mood ? `mood ${c.mood}` : null,
            c.notes ? `— ${c.notes}` : null,
          ]
            .filter(Boolean)
            .join(" ")
        )
        .join("\n")
    )
  );

  lines.push(
    section(
      "ACTIVITIES",
      (activities ?? [])
        .map(
          (a) =>
            `${a.date}: ${a.type}${a.duration ? ` (${a.duration})` : ""}${a.notes ? ` — ${a.notes}` : ""}`
        )
        .join("\n")
    )
  );

  lines.push(
    section(
      "HABITS TRACKED",
      (habits ?? []).map((h) => `- ${h.name}${h.active ? "" : " (inactive)"}`).join("\n")
    )
  );

  lines.push(
    section(
      "NUTRITION LOG",
      (nutritionLogs ?? [])
        .map((n) =>
          [
            `${n.log_date}${n.meal_label ? ` (${n.meal_label})` : ""}:`,
            n.description,
            n.calories ? `${n.calories} cal` : null,
            n.protein_g ? `${n.protein_g}g protein` : null,
            n.notes ? `— ${n.notes}` : null,
          ]
            .filter(Boolean)
            .join(" ")
        )
        .join("\n")
    )
  );

  lines.push(
    section(
      "SYMPTOM LOG",
      (symptomLogs ?? [])
        .map(
          (s) =>
            `${s.log_date}: ${s.client_symptoms?.name ?? "(deleted)"} (level ${s.level}/3)${s.note ? ` — ${s.note}` : ""}${s.shared_with_coach ? " [shared with coach]" : ""}`
        )
        .join("\n")
    )
  );

  lines.push(
    section(
      "SERVICE CHECK-INS",
      (serviceCheckins ?? [])
        .map((sc) =>
          [
            `${sc.date}${sc.satisfaction ? ` (satisfaction ${sc.satisfaction}/5)` : ""}:`,
            sc.what_working ? `\n  What's changed: ${sc.what_working}` : null,
            sc.what_would_help ? `\n  Would help: ${sc.what_would_help}` : null,
            sc.anything_else ? `\n  Anything else: ${sc.anything_else}` : null,
          ]
            .filter(Boolean)
            .join("")
        )
        .join("\n")
    )
  );

  lines.push(
    section(
      "MILESTONES",
      (milestones ?? [])
        .map(
          (m) =>
            `${m.title}${m.achieved_at ? ` — achieved ${m.achieved_at.slice(0, 10)}` : " — not yet achieved"}${m.notes ? `: ${m.notes}` : ""}`
        )
        .join("\n")
    )
  );

  lines.push(
    section(
      "PAYMENTS",
      (payments ?? [])
        .map(
          (p) =>
            `${p.due_date}: ${p.description} — $${p.amount} — ${p.paid_on ? `paid ${p.paid_on}` : "unpaid"}`
        )
        .join("\n")
    )
  );

  lines.push(
    section(
      "ATTENDANCE HISTORY",
      (occurrences ?? [])
        .filter((o) => o.status !== "scheduled")
        .map(
          (o) =>
            `${o.occurrence_date}: ${o.status}${o.rescheduled_to_date ? ` (moved to ${o.rescheduled_to_date})` : ""}`
        )
        .join("\n")
    )
  );

  lines.push(
    section(
      "DOCUMENTS SIGNED",
      (acks ?? [])
        .map((a) => {
          const doc = (a as unknown as { legal_documents: { title: string } | null })
            .legal_documents;
          return `${doc?.title ?? "Document"} — ${a.signed_name ? `signed by ${a.signed_name}` : "read"} on ${a.acknowledged_at.slice(0, 10)}`;
        })
        .join("\n")
    )
  );

  const communityLines = [
    ...(communityPosts ?? []).map(
      (p) => `Post (${p.created_at.slice(0, 10)}, ${p.kind}): ${p.body ?? "(photo only)"}`
    ),
    ...(communityComments ?? []).map(
      (c) => `Comment (${c.created_at.slice(0, 10)}): ${c.body}`
    ),
  ];
  lines.push(section("MY COMMUNITY POSTS & COMMENTS", communityLines.join("\n")));

  return lines.join("\n");
}
