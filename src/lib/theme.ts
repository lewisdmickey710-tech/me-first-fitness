export type ClientTheme = "rose" | "ocean" | "slate" | "amber";

export const CLIENT_THEMES: ClientTheme[] = ["rose", "ocean", "slate", "amber"];

export function isClientTheme(value: unknown): value is ClientTheme {
  return typeof value === "string" && (CLIENT_THEMES as string[]).includes(value);
}

// rgb triplets (space-separated, no commas -- the format Tailwind's
// `rgb(var(--x) / <alpha-value>)` colors expect) for the swappable accent
// used in buttons/links/nav, plus a lighter wash of the same color for
// backgrounds. Deliberately distinct from the phase colors (teal/pink/
// green/gold) so a theme is never mistaken for a phase indicator, and dark
// enough that white button text stays readable.
export const THEME_SWATCHES: Record<
  ClientTheme,
  { label: string; hex: string; accentRgb: string; softRgb: string }
> = {
  rose: { label: "Rose", hex: "#B9829A", accentRgb: "185 130 154", softRgb: "253 231 237" },
  ocean: { label: "Ocean", hex: "#3E7C91", accentRgb: "62 124 145", softRgb: "222 236 240" },
  slate: { label: "Slate", hex: "#5B6670", accentRgb: "91 102 112", softRgb: "227 230 233" },
  amber: { label: "Amber", hex: "#B8863A", accentRgb: "184 134 58", softRgb: "246 231 210" },
};
