import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, Heart } from "@/components/ui";
import { phaseInfo } from "@/lib/constants";
import type { Client } from "@/lib/types";

type ClientRow = Client & { care_profiles: { name: string } | null };

export default async function RosterPage() {
  const supabase = await createClient();

  const { data: clients } = (await supabase
    .from("clients")
    .select("*, care_profiles(name)")
    .order("name")) as { data: ClientRow[] | null };

  const clientIds = (clients ?? []).map((c) => c.id);

  const [{ data: pendingRequests }, { data: phaseRows }] = await Promise.all([
    supabase.from("requests").select("client_id").eq("status", "pending"),
    clientIds.length > 0
      ? supabase
          .from("client_phase_history")
          .select("client_id, phase")
          .in("client_id", clientIds)
          .is("ended_on", null)
      : Promise.resolve({ data: [] }),
  ]);

  const pendingByClient = new Map<string, number>();
  for (const r of pendingRequests ?? []) {
    pendingByClient.set(
      r.client_id,
      (pendingByClient.get(r.client_id) ?? 0) + 1
    );
  }

  const phaseByClient = new Map<string, string>();
  for (const p of phaseRows ?? []) {
    phaseByClient.set(p.client_id, p.phase);
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
            const phase = phaseInfo(phaseByClient.get(client.id) ?? "n/a");
            const pending = pendingByClient.get(client.id) ?? 0;
            return (
              <Link key={client.id} href={`/coach/clients/${client.id}`}>
                <Card className="flex items-center justify-between transition hover:border-rose/40">
                  <div>
                    <p className="font-medium text-ink">{client.name}</p>
                    <p className="mt-0.5 text-sm text-gray">
                      {client.care_profiles?.name ?? "No care profile set"}
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
