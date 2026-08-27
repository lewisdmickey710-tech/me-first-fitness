import Link from "next/link";

const TABS = [
  { href: "/coach/finances", label: "Bookkeeping" },
  { href: "/coach/documents", label: "Documents" },
  { href: "/coach/testimonials", label: "Testimonials" },
  { href: "/coach/library", label: "Library" },
] as const;

export function BackOfficeTabs({
  active,
}: {
  active: (typeof TABS)[number]["href"];
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            active === t.href ? "bg-rose text-white" : "text-gray hover:text-ink"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
