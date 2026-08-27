import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, Heart } from "@/components/ui";
import { BackOfficeTabs } from "@/components/back-office-tabs";
import type { ServiceCheckin } from "@/lib/types";

export default async function CoachTestimonialsPage() {
  const supabase = await createClient();

  const [{ data: checkins }, { data: clients }] = await Promise.all([
    supabase
      .from("service_checkins")
      .select("*")
      .eq("testimonial_consent", true)
      .order("date", { ascending: false }) as unknown as Promise<{
      data: ServiceCheckin[] | null;
    }>,
    supabase.from("clients").select("id, name") as unknown as Promise<{
      data: { id: string; name: string }[] | null;
    }>,
  ]);

  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <BackOfficeTabs active="/coach/testimonials" />

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          Testimonials
        </h1>
        <p className="mt-1 text-sm text-gray">
          Service check-ins clients said were fair game to quote. Always
          confirm specifics — using their name, a photo, where it&apos;s
          posted — before you actually share anything.
        </p>
      </div>

      {!checkins || checkins.length === 0 ? (
        <EmptyState
          title="Nothing yet"
          body="Once a client checks the testimonial box on a service check-in, it'll show up here."
        />
      ) : (
        <div className="space-y-3">
          {checkins.map((sc) => (
            <Card key={sc.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Link
                  href={`/coach/clients/${sc.client_id}?tab=measurements`}
                  className="font-medium text-ink hover:text-rose"
                >
                  {clientNameById.get(sc.client_id) ?? "Client"}
                </Link>
                <div className="flex items-center gap-2">
                  {sc.satisfaction != null ? (
                    <Badge tone="gold">{sc.satisfaction}/5</Badge>
                  ) : null}
                  <span className="text-xs text-gray">{sc.date}</span>
                </div>
              </div>
              {sc.what_working ? (
                <p className="text-sm text-ink">&ldquo;{sc.what_working}&rdquo;</p>
              ) : null}
              {sc.what_would_help ? (
                <p className="text-sm text-gray">
                  <span className="font-medium">Would make it better:</span>{" "}
                  {sc.what_would_help}
                </p>
              ) : null}
              {sc.anything_else ? (
                <p className="text-sm text-ink">&ldquo;{sc.anything_else}&rdquo;</p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
