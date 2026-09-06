"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendClientLoginLink } from "@/app/login/actions";
import { Button, Card, Heart, Input } from "@/components/ui";

type Tab = "client" | "coach";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("client");
  const [callbackError, setCallbackError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) setCallbackError(err);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-ink">
          <Heart className="mr-2" />
          MeFirstFitness
        </h1>
        <p className="mt-1 text-sm text-gray">Mind &amp; Muscle Mechanics</p>
        <p className="mt-2 text-base font-medium text-rose">
          Feel Strong. Feel Free. Feel You.
        </p>
      </div>

      {callbackError ? (
        <div className="mb-4 w-full max-w-sm rounded-xl border border-pink/40 bg-pink/5 px-4 py-3 text-sm text-ink">
          <p className="font-medium">That login link didn&apos;t work</p>
          <p className="mt-1 text-gray">{callbackError}</p>
          <p className="mt-1 text-gray">
            Try requesting a new link below — links only work once, and
            expire after a while.
          </p>
        </div>
      ) : null}

      <Card className="w-full max-w-sm">
        <div className="mb-5 flex rounded-xl bg-bg p-1">
          <button
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${
              tab === "client" ? "bg-white text-ink shadow-sm" : "text-gray"
            }`}
            onClick={() => setTab("client")}
          >
            I&apos;m a client
          </button>
          <button
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${
              tab === "coach" ? "bg-white text-ink shadow-sm" : "text-gray"
            }`}
            onClick={() => setTab("coach")}
          >
            I&apos;m the coach
          </button>
        </div>

        {tab === "client" ? (
          <p className="mb-3 text-sm font-medium text-ink">
            Already have an account?
          </p>
        ) : null}

        {tab === "client" ? <ClientLogin /> : <CoachLogin />}
      </Card>

      {tab === "client" ? (
        <p className="mt-4 text-center text-sm text-gray">
          New here?{" "}
          <a
            href="/request-assessment"
            className="inline-block rounded-full bg-rose px-4 py-1.5 font-bold text-white shadow-sm transition hover:scale-105 hover:opacity-90"
          >
            Book a free consultation ♥
          </a>
        </p>
      ) : null}

      {tab === "client" ? (
        <div className="mt-10 w-full max-w-md space-y-4">
          <h2 className="text-center text-lg font-semibold text-ink">
            New here? Here&apos;s what to expect.
          </h2>

          <Card className="space-y-2">
            <p className="font-medium text-rose">What I do</p>
            <p className="text-sm text-gray">
              NASM-based strength and movement coaching built around four
              progressive phases — Stability, Strength, Size, and Speed —
              paired with Intuitive Eating nutrition guidance. Training with
              purpose and intention, not punishment or obsession. Programs
              are built around your actual health history and current
              limitations, not a generic template — I work with injuries,
              chronic conditions, and older adults.
            </p>
          </Card>

          <Card className="space-y-2">
            <p className="font-medium text-rose">Qualifications</p>
            <p className="text-sm text-gray">
              NASM-based training plus certified specializations in
              Pain-Free Movement, Glute Development, Behavior Change, Senior
              Fitness, Bodybuilding, Strength &amp; Conditioning, and
              Nutrition.
            </p>
          </Card>

          <Card className="space-y-2">
            <p className="font-medium text-rose">Pricing</p>
            <ul className="space-y-1.5 text-sm text-gray">
              <li>
                <strong className="text-ink">$40/session</strong> —
                in-person, hands-on coaching (assisted stretching, foam
                rolling, Theragun work)
              </li>
              <li>
                <strong className="text-ink">$90/month</strong> — virtual,
                your program is built and updated in the app on my own
                cadence
              </li>
              <li>
                <strong className="text-ink">$50</strong> — a standalone
                written program, no ongoing coaching
              </li>
            </ul>
            <p className="text-xs text-gray">
              Every new client starts with a free assessment — movement,
              posture &amp; goals — then 50% off your first paid session
              after you sign on. No pressure, no obligation.
            </p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function ClientLogin() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email.");
      return;
    }
    setLoading(true);
    try {
      await sendClientLoginLink(trimmedEmail);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="py-4 text-center">
        <Heart className="mb-2 inline-block text-lg" />
        <p className="font-medium text-ink">Check your email</p>
        <p className="mt-1 text-sm text-gray">
          We sent a login link to {email.trim()}. Tap it on this device to
          get in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Your email
        </label>
        <Input
          type="text"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      {error ? <p className="text-sm text-pink">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send me a login link"}
      </Button>
      <p className="text-center text-xs text-gray">
        No password needed — we&apos;ll email you a one-time link. Look for
        an email from <strong>MeFirstFitness</strong> (check spam if you
        don&apos;t see it in a couple minutes).
      </p>
    </form>
  );
}

function CoachLogin() {
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/";
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
  }

  if (mode === "forgot") {
    if (resetSent) {
      return (
        <div className="py-4 text-center">
          <Heart className="mb-2 inline-block text-lg" />
          <p className="font-medium text-ink">Check your email</p>
          <p className="mt-1 text-sm text-gray">
            We sent a password reset link to {email}. Open it on this device.
          </p>
        </div>
      );
    }
    return (
      <form onSubmit={handleForgotPassword} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Email
          </label>
          <Input
            type="text"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="coach@mefirstfitness.com"
          />
        </div>
        {error ? <p className="text-sm text-pink">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError(null);
          }}
          className="block w-full text-center text-xs text-gray hover:text-ink"
        >
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Email
        </label>
        <Input
          type="text"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="coach@mefirstfitness.com"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Password
        </label>
        <Input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-pink">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setMode("forgot");
          setError(null);
        }}
        className="block w-full text-center text-xs text-gray hover:text-ink"
      >
        Forgot password?
      </button>
    </form>
  );
}
