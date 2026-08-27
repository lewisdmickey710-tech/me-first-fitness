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
    <header className="border-b border-grayLt bg-pink/15 print:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <a href="/" className="shrink-0 font-semibold text-ink">
          <Heart className="mr-1.5" />
          {title}
        </a>
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
      {links && links.length > 0 ? (
        // A narrow phone screen can't fit every link on one line the way
        // a desktop can -- rather than hiding the whole nav below some
        // breakpoint with nothing to replace it (the previous behavior),
        // this scrolls horizontally on any screen too narrow to show it
        // all at once, so the nav is always reachable.
        <nav className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 pb-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-medium text-ink shadow-sm hover:bg-rose hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
      ) : null}
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
