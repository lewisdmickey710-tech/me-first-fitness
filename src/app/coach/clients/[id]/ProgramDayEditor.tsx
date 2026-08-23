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
import { Button, Input, Select } from "@/components/ui";

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
  exerciseOptions,
}: {
  clientId: string;
  exercises: ProgramExerciseRow[];
  exerciseOptions: { id: string; name: string }[];
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
                exerciseOptions={exerciseOptions}
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
  exerciseOptions,
}: {
  clientId: string;
  exercise: ProgramExerciseRow;
  exerciseOptions: { id: string; name: string }[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.pdeId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const boundSave = setClientProgramOverride.bind(null, clientId);

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
            <Select
              name="substitute_exercise_id"
              defaultValue={exercise.substituteExerciseId ?? ""}
            >
              <option value="">— No swap (use prescribed) —</option>
              {exerciseOptions.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </Select>
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
