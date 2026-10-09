import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createEvent, deleteEvent, replaceEventPdf, setEventVisibility } from "./actions";
import { ConfirmButton } from "@/components/confirm-button";
import { Badge, Button, Card, EmptyState, Heart, Input, Select, Textarea } from "@/components/ui";
import { toDateString, nowInBusinessTz } from "@/lib/timezone";
import { formatTimeOfDay } from "@/lib/schedule";
import type { CoachEvent, SessionRequest } from "@/lib/types";

export default async function CoachClassesPage() {
  const supabase = await createClient();
  const todayStr = toDateString(nowInBusinessTz());

  const [{ data: events }, { data: interest }] = await Promise.all([
    supabase
      .from("coach_events")
      .select("*")
      .order("event_date", { ascending: false }) as unknown as Promise<{ data: CoachEvent[] | null }>,
    supabase
      .from("requests")
      .select("*, clients(id, name)")
      .eq("request_type", "class_interest") as unknown as Promise<{
      data: (SessionRequest & { clients: { id: string; name: string } | null })[] | null;
    }>,
  ]);

  const interestByEvent = new Map<string, { id: string; name: string }[]>();
  for (const r of interest ?? []) {
    if (!r.event_id || !r.clients) continue;
    const list = interestByEvent.get(r.event_id) ?? [];
    list.push(r.clients);
    interestByEvent.set(r.event_id, list);
  }

  const pdfPaths = (events ?? []).filter((e) => e.pdf_path).map((e) => e.pdf_path as string);
  const signedUrlByPath = new Map<string, string>();
  if (pdfPaths.length > 0) {
    const admin = createAdminClient();
    await Promise.all(
      pdfPaths.map(async (path) => {
        const { data } = await admin.storage.from("class-pdfs").createSignedUrl(path, 3600);
        if (data) signedUrlByPath.set(path, data.signedUrl);
      })
    );
  }

  const upcoming = (events ?? []).filter((e) => e.event_date >= todayStr).reverse();
  const past = (events ?? []).filter((e) => e.event_date < todayStr);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Classes &amp; Workshops
      </h1>
      <p className="text-sm text-gray">
        Schedule a group class or workshop -- it blocks that time on your calendar like
        anything else, and you choose whether to share it on clients&apos; own schedules.
      </p>

      <Card>
        <form action={createEvent} className="space-y-3">
          <p className="font-medium text-ink">New class or workshop</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Type</label>
              <Select name="kind" defaultValue="class">
                <option value="class">Group class</option>
                <option value="workshop">Workshop</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Date</label>
              <Input name="event_date" type="date" required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Title</label>
            <Input name="title" required placeholder="e.g. Beginner HIIT" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Start time</label>
              <Input name="start_time" type="time" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">End time</label>
              <Input name="end_time" type="time" required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Description <span className="font-normal text-gray">(optional)</span>
            </label>
            <Textarea name="description" rows={2} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Class format PDF <span className="font-normal text-gray">(optional)</span>
            </label>
            <input
              type="file"
              name="pdf"
              accept="application/pdf"
              className="block w-full text-xs text-gray file:mr-3 file:rounded-lg file:border-0 file:bg-rose/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-rose"
            />
          </div>
          <Button type="submit">Add to calendar</Button>
        </form>
      </Card>

      <div className="space-y-3">
        <p className="font-medium text-ink">Upcoming</p>
        {upcoming.length === 0 ? (
          <EmptyState title="Nothing scheduled" body="Classes and workshops you add will show up here." />
        ) : (
          upcoming.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              interested={interestByEvent.get(e.id) ?? []}
              pdfUrl={e.pdf_path ? signedUrlByPath.get(e.pdf_path) : undefined}
            />
          ))
        )}
      </div>

      {past.length > 0 ? (
        <div className="space-y-3">
          <p className="font-medium text-ink">Past</p>
          {past.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              interested={interestByEvent.get(e.id) ?? []}
              pdfUrl={e.pdf_path ? signedUrlByPath.get(e.pdf_path) : undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EventCard({
  event,
  interested,
  pdfUrl,
}: {
  event: CoachEvent;
  interested: { id: string; name: string }[];
  pdfUrl?: string;
}) {
  return (
    <Card className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Badge tone={event.kind === "workshop" ? "gold" : "teal"}>
            {event.kind === "workshop" ? "Workshop" : "Group class"}
          </Badge>
          <p className="mt-1 font-medium text-ink">{event.title}</p>
          <p className="text-sm text-gray">
            {event.event_date} · {formatTimeOfDay(event.start_time)}–
            {formatTimeOfDay(event.end_time)}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await deleteEvent(event.id);
          }}
        >
          <ConfirmButton
            confirmText={`Delete "${event.title}"? This also frees up that time on your calendar.`}
            variant="danger"
          >
            Delete
          </ConfirmButton>
        </form>
      </div>

      {event.description ? <p className="text-sm text-ink">{event.description}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <form
          action={async () => {
            "use server";
            await setEventVisibility(event.id, !event.visible_to_clients);
          }}
        >
          <Button type="submit" variant={event.visible_to_clients ? "secondary" : "primary"}>
            {event.visible_to_clients ? "Shared with clients ✓" : "Share with clients"}
          </Button>
        </form>

        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-rose hover:underline"
          >
            View class format PDF →
          </a>
        ) : null}
      </div>

      <form action={replaceEventPdf.bind(null, event.id)} className="flex items-center gap-2">
        <input
          type="file"
          name="pdf"
          accept="application/pdf"
          required
          className="block flex-1 text-xs text-gray file:mr-3 file:rounded-lg file:border-0 file:bg-rose/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-rose"
        />
        <Button type="submit" variant="secondary">
          {pdfUrl ? "Replace PDF" : "Upload PDF"}
        </Button>
      </form>

      <div>
        <p className="text-xs font-medium text-gray">
          {interested.length === 0
            ? "No interest yet"
            : `${interested.length} interested: ${interested.map((c) => c.name).join(", ")}`}
        </p>
      </div>
    </Card>
  );
}
