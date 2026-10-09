import { makeT, type Locale } from "@/lib/i18n";

// Read-only, client-facing display of a reply the coach left on a
// specific logged item -- the counterpart to ItemReplyEditor, which is
// coach-only.
export function ItemReplyDisplay({
  emoji,
  note,
  locale,
}: {
  emoji: string | null;
  note: string | null;
  locale?: Locale;
}) {
  if (!emoji && !note) return null;
  const t = makeT(locale);
  return (
    <p className="rounded-lg bg-rose/5 px-2.5 py-1.5 text-sm text-ink">
      <span className="font-medium text-rose">
        {t("Mickey replied")}
        {emoji ? ` ${emoji}` : ""}
        {note ? ":" : ""}
      </span>
      {note ? ` ${note}` : ""}
    </p>
  );
}
