"use client";

import { createClient } from "@/lib/supabase/client";
import { Heart } from "@/components/ui";

export function TopNav({
  title,
  links,
  faqHref,
}: {
  title: string;
  links?: { href: string; label: string }[];
  faqHref?: string;
}) {
  return (
    <header className="border-b border-grayLt bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <a href="/" className="shrink-0 font-semibold text-ink">
          <Heart className="mr-1.5" />
          {title}
        </a>
        <nav className="hidden flex-wrap gap-x-5 gap-y-2 sm:flex">
          {links?.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-gray hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-4">
          {faqHref ? (
            <a href={faqHref} className="text-sm text-gray hover:text-ink">
              FAQ
            </a>
          ) : null}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

function SignOutButton() {
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-gray hover:text-ink"
    >
      Sign out
    </button>
  );
}
