"use client";

import { useMemo, useState } from "react";

const LB_PER_KG = 2.2046226218;

const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary (little/no exercise)", multiplier: 1.2 },
  { id: "light", label: "Light (1-3 days/week)", multiplier: 1.375 },
  { id: "moderate", label: "Moderate (3-5 days/week)", multiplier: 1.55 },
  { id: "active", label: "Active (6-7 days/week)", multiplier: 1.725 },
  { id: "very_active", label: "Very active (physical job, 2x/day)", multiplier: 1.9 },
] as const;

const GOAL_DIRECTIONS = [
  { id: "lose", label: "Lose weight (-500 cal/day)", adjustment: -500 },
  { id: "maintain", label: "Maintain", adjustment: 0 },
  { id: "gain", label: "Gain weight (+350 cal/day)", adjustment: 350 },
] as const;

const inputClass =
  "w-full rounded-xl border border-grayLt bg-white px-3 py-2 text-sm text-ink";

export function CalorieGoalField({
  defaultEnabled,
  defaultGoal,
}: {
  defaultEnabled: boolean;
  defaultGoal: number | null;
}) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [goal, setGoal] = useState(defaultGoal != null ? String(defaultGoal) : "");
  const [showCalculator, setShowCalculator] = useState(false);

  const [sex, setSex] = useState<"female" | "male">("female");
  const [weightLb, setWeightLb] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [age, setAge] = useState("");
  const [activity, setActivity] = useState<(typeof ACTIVITY_LEVELS)[number]["id"]>(
    "sedentary"
  );
  const [goalDirection, setGoalDirection] =
    useState<(typeof GOAL_DIRECTIONS)[number]["id"]>("maintain");

  const suggestion = useMemo(() => {
    const w = parseFloat(weightLb);
    const ft = parseFloat(heightFt) || 0;
    const inch = parseFloat(heightIn) || 0;
    const a = parseFloat(age);
    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(a) || a <= 0) return null;
    if (ft <= 0 && inch <= 0) return null;

    const weightKg = w / LB_PER_KG;
    const heightCm = (ft * 12 + inch) * 2.54;
    // Mifflin-St Jeor
    const bmr =
      sex === "male"
        ? 10 * weightKg + 6.25 * heightCm - 5 * a + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * a - 161;
    const multiplier =
      ACTIVITY_LEVELS.find((l) => l.id === activity)?.multiplier ?? 1.2;
    const adjustment =
      GOAL_DIRECTIONS.find((g) => g.id === goalDirection)?.adjustment ?? 0;
    return Math.round((bmr * multiplier + adjustment) / 10) * 10;
  }, [sex, weightLb, heightFt, heightIn, age, activity, goalDirection]);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="calorie_goal_enabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-grayLt text-rose focus:ring-1 focus:ring-rose"
        />
        Set a daily calorie goal for this client
      </label>
      <p className="text-xs text-gray">
        Off by default for every client, and never something a client can
        turn on themselves — only enable this if you&apos;ve decided
        calorie tracking is appropriate for them (consider disordered
        eating history/risk first).
      </p>

      {enabled ? (
        <div className="space-y-3 rounded-xl border border-grayLt p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink">
              Daily calorie goal
            </label>
            <input
              type="number"
              name="daily_calorie_goal"
              min={0}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. 1800"
              className={inputClass}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowCalculator((s) => !s)}
            className="text-xs font-medium text-rose hover:underline"
          >
            {showCalculator ? "Hide calculator" : "Calculate a suggestion →"}
          </button>

          {showCalculator ? (
            <div className="space-y-2 border-t border-grayLt pt-3">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as "female" | "male")}
                  className={inputClass}
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min={0}
                  value={weightLb}
                  onChange={(e) => setWeightLb(e.target.value)}
                  placeholder="Weight (lb)"
                  className={inputClass}
                />
                <input
                  type="number"
                  min={0}
                  value={heightFt}
                  onChange={(e) => setHeightFt(e.target.value)}
                  placeholder="Height ft"
                  className={inputClass}
                />
                <input
                  type="number"
                  min={0}
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                  placeholder="in"
                  className={inputClass}
                />
              </div>
              <select
                value={activity}
                onChange={(e) =>
                  setActivity(e.target.value as (typeof ACTIVITY_LEVELS)[number]["id"])
                }
                className={inputClass}
              >
                {ACTIVITY_LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
              <select
                value={goalDirection}
                onChange={(e) =>
                  setGoalDirection(
                    e.target.value as (typeof GOAL_DIRECTIONS)[number]["id"]
                  )
                }
                className={inputClass}
              >
                {GOAL_DIRECTIONS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>

              {suggestion !== null ? (
                <div className="flex items-center justify-between rounded-lg bg-teal/10 px-3 py-2">
                  <p className="text-sm text-ink">
                    Suggested: <strong>{suggestion} cal/day</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => setGoal(String(suggestion))}
                    className="text-xs font-medium text-rose hover:underline"
                  >
                    Use this
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray">
                  Fill in weight, height, and age for a suggestion (Mifflin-St
                  Jeor estimate — a starting point, not a prescription).
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
