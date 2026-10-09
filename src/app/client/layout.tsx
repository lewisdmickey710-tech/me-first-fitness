import { TopNav } from "@/components/nav";
import { getMyClient } from "@/lib/current-client";
import { THEME_SWATCHES, isClientTheme } from "@/lib/theme";

export default async function ClientAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getMyClient();
  const theme = isClientTheme(me?.theme) ? me.theme : "rose";
  const swatch = THEME_SWATCHES[theme];

  return (
    <div
      className="min-h-screen"
      style={
        {
          "--accent-rgb": swatch.accentRgb,
          "--accent-soft-rgb": swatch.softRgb,
        } as React.CSSProperties
      }
    >
      <TopNav
        title="MeFirstFitness"
        faqHref="/client/faq"
        settingsHref="/client/settings"
        locale={me?.language}
        tintClassName="bg-accentSoft"
      />
      <main className="mx-auto max-w-xl px-4 py-6">{children}</main>
    </div>
  );
}
