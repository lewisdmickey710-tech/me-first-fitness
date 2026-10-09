import { createClient } from "@/lib/supabase/server";
import { sendAnnouncement } from "./actions";
import { Badge, Button, Card, EmptyState, Heart, Input, Select, Textarea } from "@/components/ui";
import type { CoachAnnouncement } from "@/lib/types";

export default async function CoachAnnouncePage() {
  const supabase = await createClient();
  const { data: announcements } = (await supabase
    .from("coach_announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30)) as { data: CoachAnnouncement[] | null };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Announcements
      </h1>
      <p className="text-sm text-gray">
        A one-way push notification to every active client at once. Announcements respect
        each client&apos;s own notification preferences -- Emergency always goes through,
        even to someone who&apos;s turned announcements off.
      </p>

      <Card>
        <form action={sendAnnouncement} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Type</label>
            <Select name="category" defaultValue="announcement">
              <option value="announcement">Announcement (respects preferences)</option>
              <option value="emergency">Emergency (always delivered)</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Title</label>
            <Input name="title" required placeholder="e.g. Studio closed Friday" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Message</label>
            <Textarea name="body" required rows={3} />
          </div>
          <Button type="submit">Send to all active clients</Button>
        </form>
      </Card>

      <div className="space-y-3">
        <p className="font-medium text-ink">Sent</p>
        {!announcements || announcements.length === 0 ? (
          <EmptyState title="Nothing sent yet" body="Announcements you send will show up here." />
        ) : (
          announcements.map((a) => (
            <Card key={a.id} className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge tone={a.category === "emergency" ? "pink" : "teal"}>
                    {a.category === "emergency" ? "Emergency" : "Announcement"}
                  </Badge>
                  <p className="mt-1 font-medium text-ink">{a.title}</p>
                </div>
                <p className="shrink-0 text-xs text-gray">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-ink">{a.body}</p>
              <p className="text-xs text-gray">Sent to {a.recipient_count} client(s)</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
