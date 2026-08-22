import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { acknowledgeDocument } from "@/app/client/actions";
import { Badge, Button, Card, EmptyState, Heart } from "@/components/ui";
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
                    agreed {ack.acknowledged_at.slice(0, 10)}
                  </Badge>
                ) : (
                  <Badge tone="gold">needs your review</Badge>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm text-ink">{doc.body}</p>
              {!ack ? (
                <form
                  action={async () => {
                    "use server";
                    await acknowledgeDocument(doc.id, doc.version);
                  }}
                >
                  <Button type="submit">I have read and agree</Button>
                </form>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
