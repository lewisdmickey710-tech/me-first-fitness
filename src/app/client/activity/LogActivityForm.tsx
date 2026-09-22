"use client";

import { useRef, useState, useTransition } from "react";
import { logActivity } from "@/app/client/actions";
import { uploadFormCheckFile } from "@/lib/upload-client";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { ACTIVITY_TYPES } from "@/lib/constants";
import type { makeT } from "@/lib/i18n";

export function LogActivityForm({
  clientId,
  today,
  t,
}: {
  clientId: string;
  today: string;
  t: ReturnType<typeof makeT>;
}) {
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
          const path = await uploadFormCheckFile(clientId, "activity", photo);
          formData.set("photo_path", path);
        }
        await logActivity(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <Card>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Date")}
          </label>
          <Input name="date" type="date" required defaultValue={today} />
          <p className="mt-1 text-xs text-gray">
            {t("Forgot to log it the same day? Change the date to when it actually happened — logging it late is totally fine.")}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Type")}
          </label>
          <Select name="type" required defaultValue="">
            <option value="" disabled>
              {t("Choose one")}
            </option>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(type)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Duration")}{" "}
            <span className="font-normal text-gray">{t("(optional)")}</span>
          </label>
          <Input name="duration" placeholder={t("e.g. 30 min")} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Notes")}
          </label>
          <Textarea name="notes" rows={3} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Photo")}{" "}
            <span className="font-normal text-gray">{t("(optional)")}</span>
          </label>
          <input
            type="file"
            name="photo"
            accept="image/*"
            capture="environment"
            className="block w-full text-xs text-gray file:mr-3 file:rounded-lg file:border-0 file:bg-rose/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-rose"
          />
        </div>
        {error ? <p className="text-sm text-pink">{error}</p> : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? t("Saving…") : t("Save activity")}
        </Button>
      </form>
    </Card>
  );
}
