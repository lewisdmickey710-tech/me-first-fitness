import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
      <Link
        href="/coach/library"
        className="text-sm text-gray hover:text-ink"
      >
        ← Back to library
      </Link>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Add an exercise
      </h1>

      <ExerciseForm action={addExercise} otherExercises={exercises ?? []} />
    </div>
  );
}
