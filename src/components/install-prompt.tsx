"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";

// iOS has no programmatic "install" API (no beforeinstallprompt) -- the
// only way onto the home screen there is the manual Share -> Add to Home
// Screen flow, so this is a nudge toward that rather than a one-tap
// install button. Also doubles as the fix for "I keep getting logged
// out" -- a page just visited in Safari (not installed) is subject to
// iOS's more aggressive cookie/storage clearing for inactive sites;
// installed-standalone mode is exempt from that.
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS 13+ reports its platform as "MacIntel" but is touch-capable,
    // unlike an actual Mac.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

const DISMISSED_KEY = "mff-install-prompt-dismissed";

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      // Private browsing or storage blocked -- fine to just show it.
    }
    if (isStandalone()) return;
    setIos(isIOS());
    setVisible(true);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Nothing to persist to -- it'll just show again next visit.
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-grayLt bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-md items-start gap-3">
        <div className="flex-1 text-sm text-ink">
          <p className="font-medium">Add {BRAND.name} to your home screen</p>
          <p className="mt-0.5 text-xs text-gray">
            {ios ? (
              <>
                Tap the Share icon, then &quot;Add to Home Screen&quot; — it
                opens faster and feels like a real app.
              </>
            ) : (
              <>
                Open your browser menu and choose &quot;Add to Home
                Screen&quot; or &quot;Install app&quot; — it opens faster and
                feels like a real app.
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-gray hover:text-ink"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
