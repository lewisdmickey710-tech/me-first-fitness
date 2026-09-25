"use client";

import { useRef, useState, useTransition } from "react";
import { addNutritionLog } from "@/app/client/actions";
import { uploadFormCheckFile } from "@/lib/upload-client";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { makeT, type Locale } from "@/lib/i18n";

export function NutritionLogForm({
  clientId,
  todayStr,
  locale,
}: {
  clientId: string;
  todayStr: string;
  locale: Locale;
}) {
  const t = makeT(locale);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const photo = formData.get("photo");
    formData.delete("photo");

    startTransition(async () => {
      try {
        if (photo instanceof File && photo.size > 0) {
          const path = await uploadFormCheckFile(clientId, "nutrition", photo);
          formData.set("photo_path", path);
        }
        await addNutritionLog(formData);
        form.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <Card>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Date")}
            </label>
            <Input name="log_date" type="date" required defaultValue={todayStr} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Meal")}
            </label>
            <Input name="meal_label" placeholder={t("e.g. Lunch")} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Photo")}{" "}
            <span className="font-normal text-gray">
              {t("(easiest option — just snap it, no description needed)")}
            </span>
          </label>
          <input
            type="file"
            name="photo"
            accept="image/*"
            capture="environment"
            className="block w-full text-xs text-gray file:mr-3 file:rounded-lg file:border-0 file:bg-rose/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-rose"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("What did you eat?")}
          </label>
          <Textarea name="description" rows={2} placeholder={t("Optional")} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Hunger before (1–10)")}
            </label>
            <Input name="hunger_before" type="number" min={1} max={10} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Fullness after (1–10)")}
            </label>
            <Input name="fullness_after" type="number" min={1} max={10} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Satisfaction (1–5)")}
            </label>
            <Input name="satisfaction" type="number" min={1} max={5} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Calories")}
            </label>
            <Input name="calories" type="number" min={0} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Protein (g)")}
            </label>
            <Input name="protein_g" type="number" min={0} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Carbs (g)")}
            </label>
            <Input name="carbs_g" type="number" min={0} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Fat (g)")}
          </label>
          <Input name="fat_g" type="number" min={0} className="max-w-[8rem]" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Notes")}
          </label>
          <Textarea name="notes" rows={2} placeholder={t("Optional")} />
        </div>
        {error ? <p className="text-sm text-pink">{error}</p> : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? t("Saving…") : t("Save entry")}
        </Button>
      </form>
    </Card>
  );
}
