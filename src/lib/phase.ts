import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClientPhaseHistory, Phase } from "@/lib/types";

export async function getCurrentPhase(
  supabase: SupabaseClient,
  clientId: string
): Promise<ClientPhaseHistory | null> {
  const { data } = await supabase
    .from("client_phase_history")
    .select("*")
    .eq("client_id", clientId)
    .is("ended_on", null)
    .order("started_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ClientPhaseHistory) ?? null;
}

export function weekInPhase(startedOn: string): number {
  const start = new Date(startedOn);
  const now = new Date();
  const days = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, Math.floor(days / 7) + 1);
}

export function nextPhase(phase: Phase): Phase {
  const order: Phase[] = ["1", "2", "3", "4"];
  const idx = order.indexOf(phase);
  return order[(idx + 1) % order.length];
}
