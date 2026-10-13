"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderClientProgramDay, setClientProgramOverride } from "@/app/coach/actions";
import { Button, Input } from "@/components/ui";
import { ExerciseAutocomplete, type ExerciseLibraryEntry } from "@/components/exercise-autocomplete";

export interface ProgramExerciseRow {
  pdeId: string;
  name: string;
  sets: string | null;
  reps: string | null;
  tempo: string | null;
  substituteExerciseId: string | null;
  setsOverride: string | null;
  repsOverride: string | null;
  tempoOverride: string | null;
  removed: boolean;
}

export function ProgramDayEditor({
  clientId,
  exercises,
  exerciseLibrary,
}: {
  clientId: string;
  exercises: ProgramExerciseRow[];
  exerciseLibrary: ExerciseLibraryEntry[];
}) {
  const [order, setOrder] = useState(exercises.map((e) => e.pdeId));
  const byId = new Map(exercises.map((e) => [e.pdeId, e]));
  const router = useRouter();
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    startTransition(async () => {
      await reorderClientProgramDay(clientId, next);
      router.refresh();
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {order.map((pdeId) => {
            const exercise = byId.get(pdeId);
            if (!exercise) return null;
            return (
              <SortableExerciseCard
                key={pdeId}
                clientId={clientId}
                exercise={exercise}
                exerciseLibrary={exerciseLibrary}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableExerciseCard({
  clientId,
  exercise,
  exerciseLibrary,
}: {
  clientId: string;
  exercise: ProgramExerciseRow;
  exerciseLibrary: ExerciseLibraryEntry[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.pdeId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const boundSave = setClientProgramOverride.bind(null, clientId);

  const initialSubstitute = exercise.substituteExerciseId
    ? exerciseLibrary.find((e) => e.id === exercise.substituteExerciseId) ?? null
    : null;
  const [substituteText, setSubstituteText] = useState(initialSubstitute?.name ?? "");
  const [substituteId, setSubstituteId] = useState(exercise.substituteExerciseId ?? "");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-2 rounded-xl border p-3 ${
        exercise.removed ? "border-pink/40 bg-pink/5" : "border-grayLt"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder"
        className="mt-1 shrink-0 touch-none cursor-grab select-none px-1 text-lg leading-none text-gray active:cursor-grabbing"
      >
        ⠿
      </button>

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-ink">
            {exercise.name}
            {exercise.removed ? (
              <span className="ml-2 text-xs font-normal text-pink">
                removed for this client
              </span>
            ) : null}
          </p>
          <p className="whitespace-nowrap text-xs text-gray">
            prescribed {exercise.sets}×{exercise.reps}
            {exercise.tempo ? ` @ ${exercise.tempo}` : ""}
          </p>
        </div>

        <form action={boundSave} className="space-y-2">
          <input type="hidden" name="program_day_exercise_id" value={exercise.pdeId} />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex gap-1">
              <div className="flex-1">
                <ExerciseAutocomplete
                  value={substituteText}
                  exercises={exerciseLibrary}
                  placeholder="Search to swap..."
                  onChangeText={(text) => {
                    setSubstituteText(text);
                    setSubstituteId("");
                  }}
                  onSelect={(ex) => {
                    setSubstituteText(ex.name);
                    setSubstituteId(ex.id);
                  }}
                />
              </div>
              {substituteText ? (
                <button
                  type="button"
                  onClick={() => {
                    setSubstituteText("");
                    setSubstituteId("");
                  }}
                  className="shrink-0 text-xs text-gray hover:text-ink"
                  title="Clear swap -- use prescribed"
                >
                  ✕
                </button>
              ) : null}
              <input type="hidden" name="substitute_exercise_id" value={substituteId} />
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-grayLt px-3 py-2 text-sm text-ink">
              <input
                type="checkbox"
                name="removed"
                defaultChecked={exercise.removed}
                className="h-4 w-4 rounded border-grayLt text-rose"
              />
              Remove for this client
            </label>
          </div>
          {substituteText && !substituteId ? (
            <p className="text-xs text-pink">
              Pick a suggestion from the list, or clear this field -- typed
              text alone won&apos;t be saved as a swap.
            </p>
          ) : null}
          <div className="grid grid-cols-3 gap-2">
            <Input
              name="sets_override"
              placeholder="Sets (override)"
              defaultValue={exercise.setsOverride ?? ""}
            />
            <Input
              name="reps_override"
              placeholder="Reps (override)"
              defaultValue={exercise.repsOverride ?? ""}
            />
            <Input
              name="tempo_override"
              placeholder="Tempo (override)"
              defaultValue={exercise.tempoOverride ?? ""}
            />
          </div>
          <Button type="submit" variant="secondary">
            Save
          </Button>
        </form>
      </div>
    </div>
  );
}
