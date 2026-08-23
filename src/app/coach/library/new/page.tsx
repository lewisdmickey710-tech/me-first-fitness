import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/back-link";
import { Heart } from "@/components/ui";
import type { Exercise } from "@/lib/types";
import { addExercise } from "@/app/coach/library/actions";
import { ExerciseForm } from "@/app/coach/library/ExerciseForm";

export default async function NewExercisePage() {
  const supabase = await createClient();
  const { data: exercises } = (await supabase
    .from("exercises")
    .select("*")
    .order("name")) as { data: Exercise[] | null };

  return (
    <div className="space-y-6">
      <BackLink href="/coach/library">← Back to library</BackLink>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Add an exercise
      </h1>

      <ExerciseForm action={addExercise} otherExercises={exercises ?? []} />
    </div>
  );
}
