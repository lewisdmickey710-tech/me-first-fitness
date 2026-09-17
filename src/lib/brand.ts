// Central branding config for this deployment -- change the env vars below
// (see .env.local.example) to re-skin the app for a different business
// without touching code. Defaults match this app's current branding, so
// leaving them unset changes nothing.
//
// NEXT_PUBLIC_ is safe here: none of this is sensitive, and some of it
// (login screen, public assessment-request page) is rendered client-side.
export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "MeFirstFitness",
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE ?? "Mind & Muscle Mechanics",
  coachName: process.env.NEXT_PUBLIC_BRAND_COACH_NAME ?? "Mickey",
  accentColor: process.env.NEXT_PUBLIC_BRAND_ACCENT_COLOR ?? "#E75480",
} as const;

// Resend "from" address -- kept as its own var (rather than folded into
// BRAND) since it's only ever read server-side.
export const FROM_EMAIL = process.env.EMAIL_FROM ?? `${BRAND.name} <onboarding@resend.dev>`;
