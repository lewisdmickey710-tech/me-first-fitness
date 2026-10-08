import type { NutritionSessionDetails, SessionType } from "@/lib/types";

// Shared between the log form, the save action, and anywhere a
// nutritionist session's details get displayed, so the field list only
// ever lives in one place.
export const NUTRITION_SESSION_FIELDS: {
  key: keyof NutritionSessionDetails;
  label: string;
  placeholder: string;
}[] = [
  {
    key: "eating_patterns",
    label: "Current eating patterns / habits",
    placeholder: "Typical meals, timing, portion sizes, water intake...",
  },
  {
    key: "goals",
    label: "Goals discussed",
    placeholder: "What they want to work toward this cycle",
  },
  {
    key: "recommendations",
    label: "Meal plan / recommendations given",
    placeholder: "Specific swaps, portions, meal ideas, supplements...",
  },
  {
    key: "challenges",
    label: "Challenges or barriers",
    placeholder: "Time, budget, cravings, social situations...",
  },
  {
    key: "follow_ups",
    label: "Follow-up action items",
    placeholder: "What they're trying before the next session",
  },
];

// Builds the nutrition_details object to save from the log form's fields --
// null for anything other than a nutritionist session, and null (not an
// object of empty strings) if every field was left blank.
export function parseNutritionDetails(
  formData: FormData,
  sessionType: SessionType
): NutritionSessionDetails | null {
  if (sessionType !== "nutritionist") return null;

  const details = Object.fromEntries(
    NUTRITION_SESSION_FIELDS.map((f) => [
      f.key,
      String(formData.get(`nutrition_${f.key}`) ?? "").trim() || null,
    ])
  ) as unknown as NutritionSessionDetails;

  const hasContent = NUTRITION_SESSION_FIELDS.some((f) => details[f.key]);
  return hasContent ? details : null;
}
