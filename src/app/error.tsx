"use client";

import { useEffect } from "react";
import { BRAND } from "@/lib/brand";

// Catches any otherwise-uncaught error in the app (a stale deploy being
// the most common real-world case -- a page still open from just before
// an update went out, submitting to a server action that no longer
// exists on the new deployment) and shows something a client can
// actually act on, instead of Next's raw "Application error: a
// server-side exception has occurred" page. A hard reload (not React's
// `reset()`, which only re-renders in place) is the one thing that
// reliably fixes the stale-deploy case, since it guarantees fetching the
// current deployment's JS.
export default function ErrorBoundary({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F7F3EE] px-6 text-center">
      <p className="text-2xl">&hearts;</p>
      <h1 className="text-lg font-semibold text-[#2B2320]">
        Something needs a refresh
      </h1>
      <p className="max-w-xs text-sm text-[#8A8078]">
        {BRAND.name} updates from time to time, and this screen was open
        from just before the last one. A quick refresh almost always fixes
        it.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white"
        style={{ backgroundColor: BRAND.accentColor }}
      >
        Refresh
      </button>
      <p className="mt-2 text-xs text-[#8A8078]">
        Still stuck after refreshing? Let your coach know
        {error.digest ? ` — reference code ${error.digest}.` : "."}
      </p>
    </div>
  );
}
