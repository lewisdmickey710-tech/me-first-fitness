"use client";

import { useState, useTransition } from "react";
import { updateMyTheme } from "@/app/client/actions";
import { CLIENT_THEMES, THEME_SWATCHES, type ClientTheme } from "@/lib/theme";
import { makeT, type Locale } from "@/lib/i18n";

export function ThemePicker({
  current,
  locale,
}: {
  current: ClientTheme;
  locale?: Locale;
}) {
  const t = makeT(locale);
  const [selected, setSelected] = useState(current);
  const [pending, startTransition] = useTransition();

  function pick(theme: ClientTheme) {
    if (theme === selected) return;
    setSelected(theme);
    startTransition(async () => {
      await updateMyTheme(theme);
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      {CLIENT_THEMES.map((theme) => {
        const swatch = THEME_SWATCHES[theme];
        const isSelected = selected === theme;
        return (
          <button
            key={theme}
            type="button"
            disabled={pending}
            onClick={() => pick(theme)}
            aria-pressed={isSelected}
            className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium transition disabled:opacity-50 ${
              isSelected ? "border-ink" : "border-grayLt hover:border-gray"
            }`}
          >
            <span
              className="h-7 w-7 rounded-full border border-black/10"
              style={{ backgroundColor: swatch.hex }}
              aria-hidden
            />
            <span className="text-ink">{t(swatch.label)}</span>
          </button>
        );
      })}
    </div>
  );
}
