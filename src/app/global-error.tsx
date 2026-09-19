"use client";

import { useEffect } from "react";
import { BRAND } from "@/lib/brand";

// Same as error.tsx, but for an error thrown in the root layout itself
// (rare, but without this, that specific case would still fall through
// to Next's raw error page). Next requires this file to render its own
// <html>/<body> since it replaces the root layout entirely when it fires.
export default function GlobalErrorBoundary({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F7F3EE] px-6 text-center">
          <p className="text-2xl">&hearts;</p>
          <h1 className="text-lg font-semibold text-[#2B2320]">
            Something needs a refresh
          </h1>
          <p className="max-w-xs text-sm text-[#8A8078]">
            {BRAND.name} updates from time to time, and this screen was
            open from just before the last one. A quick refresh almost
            always fixes it.
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
      </body>
    </html>
  );
}
