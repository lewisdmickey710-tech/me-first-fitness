import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, Heart } from "@/components/ui";
import type { CareProfile } from "@/lib/types";

export default async function ProgramsPage() {
  const supabase = await createClient();

  const { data: careProfiles } = (await supabase
    .from("care_profiles")
    .select("*")
    .order("name")) as { data: CareProfile[] | null };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Program templates
      </h1>
      <p className="text-sm text-gray">
        Every care profile gets the same shape — 3 strength days, 4 phases.
        Build out each day&apos;s exercises here, then assign this profile to
        clients from their detail page.
      </p>

      {!careProfiles || careProfiles.length === 0 ? (
        <EmptyState
          title="No care profiles yet"
          body="Run the latest database migration to seed the starting set."
        />
      ) : (
        <div className="space-y-3">
          {careProfiles.map((cp) => (
            <Link key={cp.id} href={`/coach/programs/${cp.id}`}>
              <Card className="transition hover:border-rose/40">
                <p className="font-medium text-ink">{cp.name}</p>
                {cp.description ? (
                  <p className="mt-1 text-sm text-gray">{cp.description}</p>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
