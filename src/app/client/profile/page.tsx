import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { submitClientProfile } from "@/app/client/actions";
import { Badge, Button, Card, EmptyState, Heart, Input, Select } from "@/components/ui";
import { US_TIMEZONES } from "@/lib/timezone";
import type {
  ClientDocumentAcknowledgment,
  ClientDocumentAssignment,
  LegalDocument,
  Payment,
} from "@/lib/types";

export default async function ClientProfilePage() {
  const me = await getMyClient();

  if (!me) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Something went wrong linking your account. Reach out and I'll get it sorted."
      />
    );
  }

  const isFirstTime = !me.profile_completed_at;
  const supabase = await createClient();

  const [{ data: documents }, { data: acks }, { data: assignments }, { data: paidPayments }, { count: sessionCount }] =
    isFirstTime
      ? [
          { data: [] as LegalDocument[] },
          { data: [] as ClientDocumentAcknowledgment[] },
          { data: [] as ClientDocumentAssignment[] },
          { data: [] as Payment[] },
          { count: 0 },
        ]
      : await Promise.all([
          supabase.from("legal_documents").select("*").order("key") as unknown as Promise<{
            data: LegalDocument[] | null;
          }>,
          supabase
            .from("client_document_acknowledgments")
            .select("*")
            .eq("client_id", me.id) as unknown as Promise<{
            data: ClientDocumentAcknowledgment[] | null;
          }>,
          supabase
            .from("client_document_assignments")
            .select("*")
            .eq("client_id", me.id) as unknown as Promise<{
            data: ClientDocumentAssignment[] | null;
          }>,
          supabase
            .from("payments")
            .select("*")
            .eq("client_id", me.id)
            .not("paid_on", "is", null)
            .order("paid_on", { ascending: false })
            .limit(20) as unknown as Promise<{ data: Payment[] | null }>,
          supabase
            .from("sessions")
            .select("id", { count: "exact", head: true })
            .eq("client_id", me.id),
        ]);

  const assignedDocIds = new Set((assignments ?? []).map((a) => a.document_id));
  const ackByDocId = new Map((acks ?? []).map((a) => [`${a.document_id}:${a.document_version}`, a]));
  const visibleDocuments = (documents ?? []).filter(
    (d) => d.key !== "minor_consent" && (d.assigned_to_all || assignedDocIds.has(d.id))
  );

  return (
    <div className="space-y-6">
      {!isFirstTime ? <BackLink href="/client/dashboard" /> : null}

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        {isFirstTime ? "Let's start with the basics" : "Your profile"}
      </h1>
      <p className="text-sm text-gray">
        {isFirstTime
          ? "Just your contact info to start — quick and easy. You can update any of this any time it changes."
          : "Update any of this any time it changes."}
      </p>

      <Card>
        <form action={submitClientProfile} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Full name
            </label>
            <Input name="name" required defaultValue={me.name} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Preferred name / nickname
            </label>
            <Input
              name="preferred_name"
              defaultValue={me.preferred_name ?? ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Date of birth
            </label>
            <Input
              name="date_of_birth"
              type="date"
              defaultValue={me.date_of_birth ?? ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Phone
            </label>
            <Input name="phone" defaultValue={me.phone ?? ""} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Email
            </label>
            <Input
              name="email"
              type="text"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              defaultValue={me.email ?? ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Your timezone
            </label>
            <Select name="timezone" defaultValue={me.timezone ?? "America/Chicago"}>
              {US_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-gray">
              For virtual sessions — this is what session times get shown
              in for you.
            </p>
          </div>

          <p className="pt-2 text-sm font-medium text-gray">
            Emergency contact
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Name
              </label>
              <Input
                name="emergency_contact_name"
                defaultValue={me.emergency_contact_name ?? ""}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Phone
              </label>
              <Input
                name="emergency_contact_phone"
                defaultValue={me.emergency_contact_phone ?? ""}
              />
            </div>
          </div>

          <p className="pt-2 text-sm font-medium text-gray">
            Physician / provider{" "}
            <span className="font-normal text-gray">(optional)</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Name
              </label>
              <Input
                name="physician_name"
                defaultValue={me.physician_name ?? ""}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Phone
              </label>
              <Input
                name="physician_phone"
                defaultValue={me.physician_phone ?? ""}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            {isFirstTime ? "Continue" : "Save"}
          </Button>
        </form>
      </Card>

      {!isFirstTime ? (
        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-ink">Signed documents</p>
            <Link href="/client/documents" className="text-sm text-rose hover:underline">
              View all →
            </Link>
          </div>
          {visibleDocuments.length === 0 ? (
            <p className="text-sm text-gray">Nothing assigned yet.</p>
          ) : (
            <div className="space-y-1.5">
              {visibleDocuments.map((d) => {
                const ack = ackByDocId.get(`${d.id}:${d.version}`);
                return (
                  <div key={d.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{d.title}</span>
                    {ack ? (
                      <Badge tone="green">
                        {ack.signed_name ? "signed" : "read"} {ack.acknowledged_at.slice(0, 10)}
                      </Badge>
                    ) : (
                      <Badge tone="gold">needs review</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ) : null}

      {!isFirstTime ? (
        <Card className="space-y-2">
          <p className="font-medium text-ink">Payment history</p>
          {!paidPayments || paidPayments.length === 0 ? (
            <p className="text-sm text-gray">No payments recorded yet.</p>
          ) : (
            <div className="space-y-1.5">
              {paidPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink">
                    {p.description}{" "}
                    <span className="text-gray">— {p.paid_on}</span>
                  </span>
                  <span className="font-medium text-ink">
                    ${Number(p.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {!isFirstTime ? (
        <Card className="flex items-center justify-between">
          <div>
            <p className="font-medium text-ink">Training history</p>
            <p className="text-sm text-gray">
              {sessionCount ?? 0} session{(sessionCount ?? 0) === 1 ? "" : "s"} logged
            </p>
          </div>
          <Link href="/client/history" className="text-sm text-rose hover:underline">
            View →
          </Link>
        </Card>
      ) : null}

      {!isFirstTime ? (
        <Card className="space-y-2">
          <p className="font-medium text-ink">Your data</p>
          <p className="text-sm text-gray">
            Download everything tracked here for you — sessions, check-ins,
            measurements, documents you&apos;ve signed, all of it — for
            your own records any time, including if you ever stop
            training with Mickey.
          </p>
          <a
            href="/api/client/export"
            className="inline-block rounded-xl border border-grayLt bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-bg"
          >
            Download my data
          </a>
        </Card>
      ) : null}
    </div>
  );
}
