"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Heart, Input } from "@/components/ui";

type Tab = "client" | "coach";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("client");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-ink">
          <Heart className="mr-2" />
          MeFirstFitness
        </h1>
        <p className="mt-1 text-sm text-gray">Mind &amp; Muscle Mechanics</p>
      </div>

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

        {tab === "client" ? <ClientLogin /> : <CoachLogin />}
      </Card>

      {tab === "client" ? (
        <p className="mt-4 text-center text-xs text-gray">
          New here?{" "}
          <a
            href="/request-assessment"
            className="text-rose hover:underline"
          >
            Request a free assessment
          </a>
        </p>
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
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="py-4 text-center">
        <Heart className="mb-2 inline-block text-lg" />
        <p className="font-medium text-ink">Check your email</p>
        <p className="mt-1 text-sm text-gray">
          We sent a login link to {email}. Tap it on this device to get in.
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
          type="email"
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
        No password needed — we&apos;ll email you a one-time link.
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
      email,
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
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
            type="email"
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
          type="email"
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
