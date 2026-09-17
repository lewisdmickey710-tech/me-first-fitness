# Standing up a new business on this codebase

This app is single-tenant by design — one deployment = one coach's
business, with its own Supabase project, Vercel project, and domain.
There's no shared multi-tenant database (yet), so a new business gets its
own full copy rather than a login inside this one. This doc is the
checklist for that.

## 1. Fork the code

1. Create a new, empty GitHub repo for the new business.
2. Push this repo's code to it (a plain `git clone` + new `git remote` +
   push works fine — there's no need to preserve this repo's git history).

## 2. Stand up infrastructure

1. **Supabase**: create a new project. In the SQL editor, run every file in
   `supabase/migrations/` **in order** (0001, 0002, ... up through the
   highest-numbered file) — this builds the full schema from scratch. The
   new project starts empty, so there's no data to clean up.
2. **Vercel**: create a new project pointed at the new repo. The Cron job
   config (`vercel.json`) comes along with the code automatically.
3. **Resend**: create a new account (or a new verified domain on an
   existing one) for the new business's outgoing email.
4. **VAPID keys** (push notifications): generate a **fresh** keypair —
   never reuse another business's keys:
   ```
   npx web-push generate-vapid-keys
   ```

## 3. Set environment variables

Copy `.env.local.example` and fill in the new project's real values —
Supabase URL/keys, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, `RESEND_API_KEY`,
`EMAIL_FROM` (must be at a domain verified in that Resend account), and
the fresh VAPID keypair. Set the same vars in Vercel's Environment
Variables settings for Production (see the app's own README for the
Supabase/Resend/cron setup details if anything is unclear).

Also set the branding vars at the top of `.env.local.example`:
`NEXT_PUBLIC_BRAND_NAME`, `NEXT_PUBLIC_BRAND_TAGLINE`,
`NEXT_PUBLIC_BRAND_COACH_NAME`, `NEXT_PUBLIC_BRAND_ACCENT_COLOR`. These
drive the app name, email templates, login/receipt headers, and PWA
metadata automatically.

## 4. Swap visual assets (can't be config-driven — these are files)

- `public/manifest.json` — edit `name`, `short_name`, `description`,
  `background_color`, `theme_color` by hand.
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`,
  `src/app/icon.png`, `src/app/apple-icon.png` — replace with the new
  business's logo/icon at the same sizes.
- `tailwind.config.ts` — the `pink`/`rose` color tokens are the app's core
  palette beyond just the email accent color; change them if the new
  business wants a different look throughout the UI, not just in emails.

## 5. Personalize the client-facing copy

The coach's name ("Mickey") and business name are woven directly into
natural-language sentences in these files — not isolated constants, so
this needs a read-through rather than a blind find/replace:

- `src/lib/i18n.ts` (the bulk of it — client-facing copy in English and
  Spanish)
- `src/app/client/faq/page.tsx`, `client/dashboard/page.tsx`,
  `client/actions.ts`, `client/video-session/page.tsx`,
  `client/schedule/page.tsx`, `client/intake/page.tsx`,
  `client/community/page.tsx`, `client/service-checkin/page.tsx`,
  `client/profile/page.tsx`
- `src/app/lead/intake/page.tsx`, `lead/dashboard/page.tsx`,
  `lead/preview/program/page.tsx`
- `src/app/coach/actions.ts`, `coach/finances/receipt/[id]/page.tsx`
- `src/components/guide-content.tsx`, `guide-content-es.tsx`,
  `availability-time-fields.tsx`
- `src/lib/timezone.ts` (one comment, not user-facing copy — optional)

A good way to find them all again: `grep -rn "Mickey" src/`.

## 6. Business-specific content (not code — data, set up after migrations run)

- **Legal/contract content**: migration `0071` seeds a coaching-contract
  row into `legal_documents` with the original business's name and
  session rates hardcoded. After running migrations on the new project,
  update that row's content directly (Supabase table editor or SQL) with
  the new business's own terms and pricing.
- **Exercise/program library**: `care_profiles`, `exercises`,
  `program_days`, etc. start **empty** on a fresh project — there's no
  shared library to inherit. Build the new business's own care
  profiles/exercises/programs from the coach UI (Coach → Library →
  Programs) once the first coach account exists.

## 7. Create the first coach login

Sign up through the app normally (magic link) — every new signup defaults
to `role = 'client'` in `profiles`. Promote that one account to coach
manually:

```sql
update public.profiles set role = 'coach' where id = '<that user's auth uid>';
```

## 8. Smoke test

- Log in as the coach, confirm the roster/schedule/availability pages
  load with no clients yet.
- Add a test client, book a session, confirm the reminder email and push
  notification both arrive branded correctly (new name, new accent
  color, new "from" address).
- Submit a test assessment request from `/request-assessment` to confirm
  the public lead-intake path works end to end.
