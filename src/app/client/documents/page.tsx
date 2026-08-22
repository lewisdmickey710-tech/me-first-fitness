import Link from "next/link";
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
import type { ClientDocumentAcknowledgment, LegalDocument } from "@/lib/types";

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

  const [{ data: documents }, { data: acks }] = await Promise.all([
    supabase.from("legal_documents").select("*").order("key") as unknown as Promise<{
      data: LegalDocument[] | null;
    }>,
    supabase
      .from("client_document_acknowledgments")
      .select("*")
      .eq("client_id", me.id) as unknown as Promise<{
      data: ClientDocumentAcknowledgment[] | null;
    }>,
  ]);

  const ackByDocumentAndVersion = new Map<string, ClientDocumentAcknowledgment>();
  for (const a of acks ?? []) {
    ackByDocumentAndVersion.set(`${a.document_id}:${a.document_version}`, a);
  }

  return (
    <div className="space-y-6">
      <Link href="/client/dashboard" className="text-sm text-gray hover:text-ink">
        ← Back
      </Link>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Contract &amp; documents
      </h1>

      <div className="space-y-4">
        {(documents ?? []).map((doc) => {
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
