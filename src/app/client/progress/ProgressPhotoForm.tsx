"use client";

import { useRef, useState, useTransition } from "react";
import { addProgressPhoto } from "@/app/client/actions";
import { uploadFormCheckFile } from "@/lib/upload-client";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import type { makeT } from "@/lib/i18n";

export function ProgressPhotoForm({
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

    if (!(photo instanceof File) || photo.size === 0) {
      setError(t("A photo is required."));
      return;
    }

    startTransition(async () => {
      try {
        const path = await uploadFormCheckFile(clientId, "progress", photo);
        formData.set("photo_path", path);
        await addProgressPhoto(formData);
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
            <Input name="date" type="date" required defaultValue={today} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              {t("Angle")}
            </label>
            <Select name="angle" defaultValue="">
              <option value="">{t("Not specified")}</option>
              <option value="front">{t("Front")}</option>
              <option value="side">{t("Side")}</option>
              <option value="back">{t("Back (angle)")}</option>
              <option value="other">{t("Other")}</option>
            </Select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Photo")}
          </label>
          <input
            type="file"
            name="photo"
            accept="image/*"
            capture="environment"
            required
            className="block w-full text-xs text-gray file:mr-3 file:rounded-lg file:border-0 file:bg-rose/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-rose"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Notes")}{" "}
            <span className="font-normal text-gray">{t("(optional)")}</span>
          </label>
          <Textarea name="notes" rows={2} />
        </div>
        {error ? <p className="text-sm text-pink">{error}</p> : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? t("Saving…") : t("Add photo")}
        </Button>
      </form>
    </Card>
  );
}
