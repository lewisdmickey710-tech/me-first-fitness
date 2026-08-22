import { createClient } from "@/lib/supabase/server";
import { updateLegalDocument } from "@/app/coach/actions";
import { Badge, Button, Card, Collapsible, Heart, Input, Textarea } from "@/components/ui";
import type { LegalDocument } from "@/lib/types";

const PLACEHOLDER_MARKER = "[PLACEHOLDER";

export default async function CoachDocumentsPage() {
  const supabase = await createClient();

  const { data: documents } = (await supabase
    .from("legal_documents")
    .select("*")
    .order("key")) as { data: LegalDocument[] | null };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Contract &amp; documents
      </h1>
      <p className="text-sm text-gray">
        Clients see these on their end and check off &quot;I have read and
        agree&quot; — the acknowledgment (with a timestamp) is kept on file.
        Editing a document and saving bumps its version, which asks every
        client to re-review and re-acknowledge it.
      </p>

      <div className="space-y-4">
        {(documents ?? []).map((doc) => {
          const isPlaceholder = doc.body.startsWith(PLACEHOLDER_MARKER);
          return (
            <Card key={doc.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{doc.title}</p>
                <div className="flex items-center gap-2">
                  {isPlaceholder ? (
                    <Badge tone="gold">draft — not yet finalized</Badge>
                  ) : (
                    <Badge tone="green">v{doc.version}</Badge>
                  )}
                </div>
              </div>

              <Collapsible label={isPlaceholder ? "Add your real text" : "Edit"}>
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await updateLegalDocument(doc.id, doc.version, formData);
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink">
                      Title
                    </label>
                    <Input name="title" defaultValue={doc.title} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink">
                      Body
                    </label>
                    <Textarea
                      name="body"
                      rows={10}
                      defaultValue={isPlaceholder ? "" : doc.body}
                      required
                    />
                  </div>
                  <Button type="submit">Save &amp; bump version</Button>
                </form>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
