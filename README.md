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

## Data model

Tables map directly to the brief: `clients`, `sessions`, `checkins`,
`activities`, `requests`, plus a `profiles` table (not in the original
brief) that stores each user's role (`coach` / `client`) so login routing
and RLS policies have something to key off of. See
`supabase/migrations/0001_init.sql` for the full schema, and
`src/lib/types.ts` for the matching TypeScript types.

## What's intentionally out of scope for v1

Per the build brief: calendar sync (beyond the request/confirm flow),
payments, multi-coach support, and in-app exercise/nutrition content. See
the brief for the full list.

## Pilot checklist before rolling out to the full roster

- [ ] Coach can log in, manage the roster, log sessions and check-ins
- [ ] 2–3 real clients have logins linked and can see only their own data
- [ ] Clients can log check-ins/activity and submit requests; coach can
      confirm/decline
- [ ] Deployed at a real URL and tested on a phone
