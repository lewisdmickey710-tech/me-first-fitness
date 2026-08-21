"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Heart, Input } from "@/components/ui";

type Status = "checking" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setStatus("ready");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus("ready");
    });

    const timeout = setTimeout(() => {
      setStatus((s) => (s === "checking" ? "invalid" : s));
    }, 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-ink">
          <Heart className="mr-2" />
          MeFirstFitness
        </h1>
        <p className="mt-1 text-sm text-gray">Set a new password</p>
      </div>

      <Card className="w-full max-w-sm">
        {status === "checking" && (
          <p className="py-6 text-center text-sm text-gray">
            Confirming your link…
          </p>
        )}

        {status === "invalid" && (
          <div className="py-4 text-center">
            <p className="font-medium text-ink">This link isn&apos;t valid</p>
            <p className="mt-1 text-sm text-gray">
              It may have expired, or already been used. Head back to the
              login page and request a fresh one.
            </p>
            <a
              href="/login"
              className="mt-4 inline-block text-sm font-medium text-rose"
            >
              Back to login
            </a>
          </div>
        )}

        {status === "ready" && done && (
          <div className="py-4 text-center">
            <Heart className="mb-2 inline-block text-lg" />
            <p className="font-medium text-ink">Password updated</p>
            <p className="mt-1 text-sm text-gray">Taking you in…</p>
          </div>
        )}

        {status === "ready" && !done && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                New password
              </label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Confirm password
              </label>
              <Input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-pink">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving…" : "Save new password"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
