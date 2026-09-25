"use client";

import { useRef, useState, useTransition } from "react";
import { addCommunityPost } from "@/app/client/community/actions";
import { uploadFormCheckFile } from "@/lib/upload-client";
import { Button, Card, Select, Textarea } from "@/components/ui";
import { makeT, type Locale } from "@/lib/i18n";

const KIND_LABEL: Record<string, string> = {
  win: "Win",
  question: "Question",
  progress: "Progress photo",
  general: "General",
};

export function PostForm({
  clientId,
  locale,
}: {
  clientId: string;
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
          const path = await uploadFormCheckFile(clientId, "community", photo);
          formData.set("photo_path", path);
        }
        await addCommunityPost(formData);
        form.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <Card>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("What kind of post is this?")}
          </label>
          <Select name="kind" defaultValue="general">
            <option value="win">{t(KIND_LABEL.win)}</option>
            <option value="question">{t(KIND_LABEL.question)}</option>
            <option value="progress">{t(KIND_LABEL.progress)}</option>
            <option value="general">{t(KIND_LABEL.general)}</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {t("Share something")}
          </label>
          <Textarea name="body" rows={3} placeholder={t("Optional if you're just posting a photo")} />
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
          {isPending ? t("Saving…") : t("Post")}
        </Button>
      </form>
    </Card>
  );
}
