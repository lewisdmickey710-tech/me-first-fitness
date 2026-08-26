# MeFirstFitness — Coaching App

Client management app for MeFirstFitness (Mind & Muscle Mechanics). One
coach, a roster of clients, session logging, check-ins, activity logging,
and session-time requests. See `docs/build-brief.md`-equivalent context in
the original build brief for the full spec — this README covers getting it
running.

## Stack

- **Next.js 14** (App Router, TypeScript) — hosted on **Vercel**
- **Supabase** — Postgres + Auth (coach: email/password, clients: magic link)
- **Tailwind CSS** — brand colors wired into `tailwind.config.ts`

## 1. Create the Supabase project

1. Create a new project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/0001_init.sql`. This creates:
   - `profiles`, `clients`, `sessions`, `checkins`, `activities`, `requests`
   - Row-level security policies (a client can only read/write their own
     rows; the coach's account can read/write everything)
   - A trigger that gives every new signed-up user a `profiles` row
     defaulting to `role = 'client'`
3. In **Authentication → Providers**, make sure **Email** is enabled, with
   **Email OTP / Magic Link** on (this is the default). Coach sign-in uses
   password auth on the same provider.
4. In **Authentication → URL Configuration**, add your site URL(s) (e.g.
   `http://localhost:3000` for local dev, and your Vercel URL once deployed)
   to the redirect allow-list so magic links work.

## 2. Create the coach account

The app has no "sign up" screen — accounts are created directly in Supabase.

1. In **Authentication → Users**, click **Add user** and create the coach's
   account with an email + password ("Auto Confirm User" on).
2. In the SQL editor, promote that user to coach:
   ```sql
   update public.profiles set role = 'coach'
   where id = (select id from auth.users where email = 'coach@example.com');
   ```
3. That's the login used on the **"I'm the coach"** tab of `/login`.

## 3. Add a client

1. In the app (as the coach), go to **Roster → + Add client** and fill in
   their name, track, and phase. This creates a `clients` row that isn't
   linked to a login yet — the coach can log sessions/check-ins for them
   right away.
2. When the client is ready to log in themselves: in Supabase, **Add user**
   with their email ("Auto Confirm User" on, no password needed since they'll
   use magic links). Then link that login to their client row:
   ```sql
   update public.clients set user_id = (
     select id from auth.users where email = 'client@example.com'
   )
   where id = '<the client row's id>';
   ```
3. The client signs in at `/login` under **"I'm a client"** with that same
   email and gets a magic link.

(A small enough roster that this manual linking step is fine for v1 — see
"Out of scope" in the build brief for why there's no self-serve signup.)

## 4. Local development

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Deploy to Vercel

1. Push this repo to GitHub (or connect it directly) and import it in
   [Vercel](https://vercel.com/new).
2. Add the same environment variables from `.env.local` in the Vercel
   project settings — set `NEXT_PUBLIC_SITE_URL` to the deployed URL.
3. Add that deployed URL to Supabase's redirect allow-list (see step 1.4).
4. Deploy. The app is mobile-responsive out of the box — no app install
   needed for clients.

## 6. Set up reminders (session + payment)

The app emails clients a reminder the day before each recurring session
time, and reminds them about payments as they come due or go overdue. This
needs a couple of one-time setup steps beyond the base Supabase/Vercel
deploy:

1. **Get the service role key.** Supabase project → Settings → API →
   `service_role` key (not the anon key). Add it as `SUPABASE_SERVICE_ROLE_KEY`
   in Vercel's environment variables. Keep this secret — it bypasses every
   RLS policy in the app.
2. **Create a `CRON_SECRET`.** Any random string (e.g.
   `openssl rand -hex 32`). Add it to Vercel's environment variables too —
   this is what stops random people from triggering your reminder job.
3. **Sign up for [Resend](https://resend.com)** (free tier: 100 emails/day).
   Create an API key and add it as `RESEND_API_KEY` in Vercel.
4. **Verify a sending domain in Resend** (Domains → Add Domain, then add the
   DNS records it gives you at your domain registrar). Until you do this,
   Resend's sandbox mode only delivers to your own account email — real
   client reminders won't go out. Once verified, set `EMAIL_FROM` to an
   address at that domain, e.g. `MeFirstFitness <reminders@mefirstfitness.com>`.
5. **Redeploy.** Vercel reads `vercel.json` and automatically schedules the
   `/api/cron/reminders` route to run once a day (12:30 UTC — 7:30 AM
   Central during daylight time, 6:30 AM once standard time starts, since
   Vercel cron schedules are fixed UTC and don't shift for DST). No manual
   cron setup needed on Vercel's end.

To use it: on a client's page, use the **Manage** link next to "Next
session" on Overview to set their recurring weekly session time(s), and the
**Payments** tab to record what they owe. Everything else is automatic.

The business timezone is hardcoded in `src/lib/timezone.ts`
(`BUSINESS_TIMEZONE`, currently `America/New_York`) — update it there if
that's not right.

## Data model

Tables map directly to the brief: `clients`, `sessions`, `checkins`,
`activities`, `requests`, plus a `profiles` table (not in the original
brief) that stores each user's role (`coach` / `client`) so login routing
and RLS policies have something to key off of. See
`supabase/migrations/0001_init.sql` for the full schema, and
`src/lib/types.ts` for the matching TypeScript types.

## What's intentionally out of scope for v1

Per the build brief: multi-coach support and in-app nutrition content. See
the brief for the full list.

Scheduling and payments now have a lightweight version (see "Set up
reminders" above): the coach sets each client's recurring weekly time(s)
and tracks what's owed manually — there's no client-facing booking
calendar and no online payment collection (Stripe or similar). Both are
reasonable future upgrades if the business outgrows manual tracking.

## Pilot checklist before rolling out to the full roster

- [ ] Coach can log in, manage the roster, log sessions and check-ins
- [ ] 2–3 real clients have logins linked and can see only their own data
- [ ] Clients can log check-ins/activity and submit requests; coach can
      confirm/decline
- [ ] Deployed at a real URL and tested on a phone
