import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, Heart } from "@/components/ui";
import type { Lead } from "@/lib/types";

export default async function LeadsPage() {
  const supabase = await createClient();

  const { data: leads } = (await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })) as { data: Lead[] | null };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Leads
      </h1>
      <p className="text-sm text-gray">
        Everyone who&apos;s requested an assessment, with their intake
        answers and screening notes in one place.
      </p>

      {!leads || leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          body="When someone requests an assessment through the app, they'll show up here."
        />
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Link key={lead.id} href={`/coach/leads/${lead.id}`}>
              <Card className="flex items-center justify-between transition hover:border-rose/40">
                <div>
                  <p className="font-medium text-ink">{lead.name}</p>
                  <p className="mt-0.5 text-sm text-gray">{lead.email}</p>
                </div>
                <StatusBadge status={lead.status} />
              </Card>
            </Link>
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
