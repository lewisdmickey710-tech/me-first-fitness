import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, Heart } from "@/components/ui";
import { phaseInfo, trackName } from "@/lib/constants";
import type { Client } from "@/lib/types";

export default async function RosterPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("name") as { data: Client[] | null };

  const { data: pendingRequests } = await supabase
    .from("requests")
    .select("client_id")
    .eq("status", "pending");

  const pendingByClient = new Map<string, number>();
  for (const r of pendingRequests ?? []) {
    pendingByClient.set(
      r.client_id,
      (pendingByClient.get(r.client_id) ?? 0) + 1
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          Your roster
        </h1>
        <Link
          href="/coach/roster/new"
          className="rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Add client
        </Link>
      </div>

      {!clients || clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          body="Add your first client to start building their program."
        />
      ) : (
        <div className="space-y-3">
          {clients.map((client) => {
            const phase = phaseInfo(client.phase);
            const pending = pendingByClient.get(client.id) ?? 0;
            return (
              <Link key={client.id} href={`/coach/clients/${client.id}`}>
                <Card className="flex items-center justify-between transition hover:border-rose/40">
                  <div>
                    <p className="font-medium text-ink">{client.name}</p>
                    <p className="mt-0.5 text-sm text-gray">
                      {trackName(client.track)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pending > 0 ? (
                      <Badge tone="pink">
                        {pending} pending request{pending > 1 ? "s" : ""}
                      </Badge>
                    ) : null}
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: phase.color }}
                    >
                      {phase.name}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
