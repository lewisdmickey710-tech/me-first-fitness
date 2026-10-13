import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { Card, Heart } from "@/components/ui";
import { makeT } from "@/lib/i18n";
import { nowInBusinessTz, toDateString } from "@/lib/timezone";
import type { TrainingSession } from "@/lib/types";
import { RepeatWorkoutForm } from "./RepeatWorkoutForm";

export default async function RepeatWorkoutPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const me = await getMyClient();
  if (!me) notFound();

  const t = makeT(me.language);
  const supabase = await createClient();
  const { data: source } = (await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("client_id", me.id)
    .eq("session_type", "freestyle")
    .not("workout_name", "is", null)
    .maybeSingle()) as { data: TrainingSession | null };

  if (!source) notFound();

  const today = toDateString(nowInBusinessTz());

  return (
    <div className="space-y-6">
      <BackLink href="/client/my-workouts" />

      <div>
        <h1 className="text-xl font-semibold text-ink">
          <Heart className="mr-1.5" />
          {source.workout_name}
        </h1>
        <p className="mt-1 text-sm text-gray">
          {t("Log today's weights and notes for each move -- the exercises, sets & reps carry over from last time.")}
        </p>
      </div>

      <Card>
        <RepeatWorkoutForm sourceSessionId={source.id} entries={source.entries} today={today} />
      </Card>
    </div>
  );
}
