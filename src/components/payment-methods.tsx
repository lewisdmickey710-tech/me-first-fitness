import type { BusinessSettings } from "@/lib/types";

export function PaymentMethods({
  settings,
}: {
  settings: BusinessSettings | null;
}) {
  if (!settings) return null;

  const cashtag = settings.cash_app_cashtag?.replace(/^\$/, "").trim() || null;
  const hasAny = cashtag || settings.zelle_info || settings.cash_note;
  if (!hasAny) return null;

  return (
    <ul className="mt-2 space-y-1 text-sm">
      {cashtag ? (
        <li>
          Cash App:{" "}
          <a
            href={`https://cash.app/$${cashtag}`}
            target="_blank"
            rel="noreferrer"
            className="text-rose hover:underline"
          >
            ${cashtag}
          </a>
        </li>
      ) : null}
      {settings.zelle_info ? (
        <li className="text-ink">Zelle: {settings.zelle_info}</li>
      ) : null}
      {settings.cash_note ? (
        <li className="text-ink">Cash: {settings.cash_note}</li>
      ) : null}
    </ul>
  );
}
