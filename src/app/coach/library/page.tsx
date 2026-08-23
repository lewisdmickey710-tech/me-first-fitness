import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/back-link";
import { Heart } from "@/components/ui";
import { LibraryFilterList } from "./LibraryFilterList";
import type { Exercise } from "@/lib/types";

export default async function LibraryPage() {
  const supabase = await createClient();

  const { data: exercises } = (await supabase
    .from("exercises")
    .select("*")
    .order("name")) as { data: Exercise[] | null };

  return (
    <div className="space-y-6">
      <BackLink href="/coach/roster">← Back to Motherboard</BackLink>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          Exercise library
        </h1>
        <Link
          href="/coach/library/new"
          className="rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Add exercise
        </Link>
      </div>

      <p className="text-sm text-gray">
        Everything here is what clients see in their program and what
        you&apos;ll pull from when building templates. Descriptions and cues
        stay collapsed until tapped, so the list stays easy to scan.
      </p>

      <LibraryFilterList exercises={exercises ?? []} />
    </div>
  );
}
