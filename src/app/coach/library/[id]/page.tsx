import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Heart } from "@/components/ui";
import type { Exercise } from "@/lib/types";
import { updateExercise } from "@/app/coach/library/actions";
import { ExerciseForm } from "@/app/coach/library/ExerciseForm";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: exercise }, { data: exercises }] = await Promise.all([
    supabase.from("exercises").select("*").eq("id", id).single() as unknown as Promise<{
      data: Exercise | null;
    }>,
    supabase.from("exercises").select("*").order("name") as unknown as Promise<{
      data: Exercise[] | null;
    }>,
  ]);

  if (!exercise) notFound();

  const boundUpdate = updateExercise.bind(null, id);
  const otherExercises = (exercises ?? []).filter((e) => e.id !== id);

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
        Edit exercise
      </h1>

      <ExerciseForm
        action={boundUpdate}
        exercise={exercise}
        otherExercises={otherExercises}
      />
    </div>
  );
}
