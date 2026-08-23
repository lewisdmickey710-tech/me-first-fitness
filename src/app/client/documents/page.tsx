import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { acknowledgeDocument } from "@/app/client/actions";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  DocumentBody,
  EmptyState,
  Heart,
  Input,
} from "@/components/ui";
import { loggedThisMonth } from "@/lib/measurement-window";
import type {
  ClientDocumentAcknowledgment,
  ClientDocumentAssignment,
  ClientMinorConsent,
  LegalDocument,
} from "@/lib/types";

export default async function ClientDocumentsPage() {
  const me = await getMyClient();

  if (!me) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Your coach hasn't linked your login to a client profile yet. Check back soon, or reach out."
      />
    );
  }

  const supabase = await createClient();

  const [
    { data: documents },
    { data: acks },
    { data: assignments },
    { data: minorConsent },
    { data: recentMeasurements },
    { data: recentServiceCheckins },
  ] = await Promise.all([
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
      .from("client_minor_consent")
      .select("*")
      .eq("client_id", me.id)
      .maybeSingle() as unknown as Promise<{ data: ClientMinorConsent | null }>,
    supabase
      .from("measurements")
      .select("date")
      .eq("client_id", me.id)
      .order("date", { ascending: false })
      .limit(3) as unknown as Promise<{ data: { date: string }[] | null }>,
    supabase
      .from("service_checkins")
      .select("date")
      .eq("client_id", me.id)
      .order("date", { ascending: false })
      .limit(3) as unknown as Promise<{ data: { date: string }[] | null }>,
  ]);

  const serviceCheckinDue =
    loggedThisMonth((recentMeasurements ?? []).map((m) => m.date)) &&
    !loggedThisMonth((recentServiceCheckins ?? []).map((c) => c.date));
  const serviceCheckinDoneThisMonth = loggedThisMonth(
    (recentServiceCheckins ?? []).map((c) => c.date)
  );

  const ackByDocumentAndVersion = new Map<string, ClientDocumentAcknowledgment>();
  for (const a of acks ?? []) {
    ackByDocumentAndVersion.set(`${a.document_id}:${a.document_version}`, a);
  }

  const assignedDocumentIds = new Set((assignments ?? []).map((a) => a.document_id));

  // Minor Consent has its own fillable page (structured fields, not just a
  // read-and-sign body) -- shown separately below, and only if the coach
  // has actually assigned it to this client.
  const visibleDocuments = (documents ?? []).filter(
    (d) =>
      d.key !== "minor_consent" &&
      (d.assigned_to_all || assignedDocumentIds.has(d.id))
  );
  const minorConsentDoc = (documents ?? []).find((d) => d.key === "minor_consent");
  const minorConsentAssigned = minorConsentDoc
    ? assignedDocumentIds.has(minorConsentDoc.id)
    : false;

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Documents &amp; check-in
      </h1>

      <div className="space-y-4">
        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-ink">Service check-in</p>
            {serviceCheckinDoneThisMonth ? (
              <Badge tone="green">done this month</Badge>
            ) : serviceCheckinDue ? (
              <Badge tone="gold">due</Badge>
            ) : null}
          </div>
          <p className="text-sm text-gray">
            A quick, honest read on how coaching&apos;s going overall — what&apos;s
            working, what&apos;s not.
          </p>
          <Link href="/client/service-checkin">
            <Button variant="secondary">
              {serviceCheckinDoneThisMonth ? "Review or update" : "Do it now"}
            </Button>
          </Link>
        </Card>

        {minorConsentAssigned ? (
          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink">Minor Consent &amp; Intake Addendum</p>
              {minorConsent?.signed_at ? (
                <Badge tone="green">
                  signed {minorConsent.signed_at.slice(0, 10)}
                </Badge>
              ) : (
                <Badge tone="gold">needs your review</Badge>
              )}
            </div>
            <p className="text-sm text-gray">
              Required alongside your child&apos;s standard intake.
            </p>
            <Link href="/client/minor-consent">
              <Button variant="secondary">
                {minorConsent?.signed_at ? "Review or update" : "Fill it out"}
              </Button>
            </Link>
          </Card>
        ) : null}

        {visibleDocuments.map((doc) => {
          const ack = ackByDocumentAndVersion.get(`${doc.id}:${doc.version}`);
          return (
            <Card key={doc.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{doc.title}</p>
                {ack ? (
                  <Badge tone="green">
                    {ack.signed_name
                      ? `signed ${ack.acknowledged_at.slice(0, 10)}`
                      : `read ${ack.acknowledged_at.slice(0, 10)}`}
                  </Badge>
                ) : (
                  <Badge tone="gold">needs your review</Badge>
                )}
              </div>
              <DocumentBody text={doc.body} />
              {ack?.signed_name ? (
                <p className="text-xs text-gray">
                  Signed by {ack.signed_name} on {ack.acknowledged_at.slice(0, 10)}
                </p>
              ) : null}
              {!ack ? (
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await acknowledgeDocument(
                      doc.id,
                      doc.version,
                      doc.requires_signature,
                      formData
                    );
                  }}
                  className="space-y-3 border-t border-grayLt pt-3"
                >
                  {doc.requires_signature ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-ink">
                        Type your full legal name to sign
                      </label>
                      <Input name="signed_name" required />
                    </div>
                  ) : null}
                  <Checkbox
                    name="agree"
                    required
                    label={
                      doc.requires_signature
                        ? "I have read and agree to the terms above"
                        : "I have read this"
                    }
                  />
                  <Button type="submit">
                    {doc.requires_signature ? "Sign & agree" : "Mark as read"}
                  </Button>
                </form>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
