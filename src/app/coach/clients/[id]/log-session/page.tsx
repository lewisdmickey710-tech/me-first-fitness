import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Heart } from "@/components/ui";
import { getProgramDays } from "@/lib/track-programs";
import type { Client } from "@/lib/types";
import { LogSessionForm } from "./LogSessionForm";

export default async function LogSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const today = new Date().toISOString().slice(0, 10);

  const supabase = await createClient();
  const { data: client } = (await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()) as { data: Client | null };

  if (!client) notFound();

  const programDays = getProgramDays(client.track, client.phase);

  return (
    <div className="space-y-6">
      <Link
        href={`/coach/clients/${id}?tab=sessions`}
        className="text-sm text-gray hover:text-ink"
      >
        ← Back
      </Link>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Log a session
      </h1>

      <LogSessionForm clientId={id} today={today} programDays={programDays} />
    </div>
  );
}
