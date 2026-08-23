import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteLead } from "@/app/coach/leads/actions";
import { Badge, Button, Card, EmptyState, Heart } from "@/components/ui";
import type { Lead } from "@/lib/types";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived: archivedParam } = await searchParams;
  const showArchived = archivedParam === "1";

  const supabase = await createClient();

  let leadsQuery = supabase.from("leads").select("*").order("created_at", { ascending: false });
  leadsQuery = showArchived
    ? leadsQuery.eq("status", "archived")
    : leadsQuery.neq("status", "archived");
  const { data: leads } = (await leadsQuery) as { data: Lead[] | null };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          {showArchived ? "Archived leads" : "Leads"}
        </h1>
        {showArchived ? (
          <Link href="/coach/leads" className="text-sm text-gray hover:text-ink">
            ← Back to leads
          </Link>
        ) : null}
      </div>
      {!showArchived ? (
        <>
          <p className="text-sm text-gray">
            Everyone who&apos;s requested an assessment, with their intake
            answers and screening notes in one place.
          </p>
          <Link
            href="/coach/leads?archived=1"
            className="inline-block text-sm text-gray hover:text-ink"
          >
            View archived leads →
          </Link>
        </>
      ) : null}

      {!leads || leads.length === 0 ? (
        <EmptyState
          title={showArchived ? "No archived leads" : "No leads yet"}
          body={
            showArchived
              ? "Leads you archive show up here."
              : "When someone requests an assessment through the app, they'll show up here."
          }
        />
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Card key={lead.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{lead.name}</p>
                <p className="mt-0.5 text-sm text-gray">{lead.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={lead.status} />
                <Link
                  href={`/coach/leads/${lead.id}`}
                  className="text-sm text-gray hover:text-ink"
                >
                  View
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await deleteLead(lead.id);
                  }}
                >
                  <Button type="submit" variant="danger">
                    Delete
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Lead["status"] }) {
  const tone =
    status === "converted" ? "green" : status === "archived" ? "gray" : "gold";
  return <Badge tone={tone}>{status}</Badge>;
}
