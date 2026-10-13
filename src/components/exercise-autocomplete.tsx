"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui";

export interface ExerciseLibraryEntry {
  id: string;
  name: string;
  // A short "Lunge · Quads" style label built from the exercise's tags --
  // shown under its name in the suggestion list, and matched against too,
  // so typing a tag ("lunge", "sagittal", "glutes") surfaces exercises
  // whose tags match even when the word isn't in the name itself.
  tag?: string;
}

// A plain text input (still named "exercise" so the surrounding form's
// existing formData.getAll("exercise") keeps working untouched) with a
// filtered dropdown of library matches underneath. Picking one links the
// row to that exercise_id; typing freely (including editing after a pick)
// clears the link, since there's no guarantee the edited text still names
// that exact movement.
export function ExerciseAutocomplete({
  value,
  exercises,
  onChangeText,
  onSelect,
  placeholder,
  className,
}: {
  value: string;
  exercises: ExerciseLibraryEntry[];
  onChangeText: (text: string) => void;
  onSelect: (exercise: ExerciseLibraryEntry) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return exercises
      .filter((e) => `${e.name} ${e.tag ?? ""}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [value, exercises]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <Input
        name="exercise"
        placeholder={placeholder}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChangeText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Deferred so the suggestion button's own click/mousedown still
          // registers before the list unmounts.
          setTimeout(() => setOpen(false), 150);
        }}
      />
      {open && matches.length > 0 ? (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-grayLt bg-white py-1 shadow-md">
          {matches.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(ex);
                  setOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-sm text-ink hover:bg-cream"
              >
                {ex.name}
                {ex.tag ? <span className="ml-1.5 text-xs text-gray">{ex.tag}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
