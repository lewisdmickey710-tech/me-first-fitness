"use client";

import { useState } from "react";

const LB_PER_KG = 2.2046226218;

function parseNumber(v: string): number | null {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Always saves as a plain lb value (e.g. "135 lb"), regardless of which
// unit the person actually typed in -- plates are usually marked in kg,
// so this lets them enter/toggle in kg without the app's stored weights
// ending up in a mix of units.
export function WeightInput({
  name,
  form,
  placeholder,
}: {
  name: string;
  form?: string;
  placeholder?: string;
}) {
  const [unit, setUnit] = useState<"lb" | "kg">("lb");
  const [text, setText] = useState("");

  const entered = parseNumber(text);
  const lbValue =
    entered === null ? null : unit === "lb" ? entered : entered * LB_PER_KG;
  const hiddenValue = lbValue !== null ? `${round1(lbValue)} lb` : "";

  function toggleUnit() {
    const next = unit === "lb" ? "kg" : "lb";
    if (entered !== null) {
      const converted = unit === "lb" ? entered / LB_PER_KG : entered * LB_PER_KG;
      setText(String(round1(converted)));
    }
    setUnit(next);
  }

  return (
    <div className="flex items-stretch gap-1">
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder ?? "Weight"}
        className="w-full rounded-xl border border-grayLt px-3 py-2 text-sm text-ink"
      />
      <button
        type="button"
        onClick={toggleUnit}
        className="shrink-0 rounded-xl border border-grayLt bg-white px-2 text-xs font-medium text-ink hover:border-rose/40"
        title="Switch between lb and kg -- always saved in lb"
      >
        {unit}
      </button>
      <input type="hidden" name={name} form={form} value={hiddenValue} />
    </div>
  );
}
