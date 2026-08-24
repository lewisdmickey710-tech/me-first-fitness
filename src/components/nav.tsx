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
    <header className="border-b border-grayLt bg-pink/15">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <a href="/" className="shrink-0 font-semibold text-ink">
          <Heart className="mr-1.5" />
          {title}
        </a>
        <nav className="hidden flex-wrap gap-2 sm:flex">
          {links?.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full bg-white px-3 py-1 text-sm font-medium text-ink shadow-sm hover:bg-rose hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {faqHref ? (
            <a
              href={faqHref}
              className="rounded-full bg-white px-3 py-1 text-sm font-medium text-ink shadow-sm hover:bg-rose hover:text-white"
            >
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
      className="rounded-full bg-white px-3 py-1 text-sm font-medium text-ink shadow-sm hover:bg-rose hover:text-white"
    >
      Sign out
    </button>
  );
}
