import { TopNav } from "@/components/nav";

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <TopNav
        title="MeFirstFitness Coach"
        links={[
          { href: "/coach/roster", label: "Roster" },
          { href: "/coach/schedule", label: "Schedule" },
          { href: "/coach/availability", label: "Availability" },
          { href: "/coach/signups", label: "Signups" },
          { href: "/coach/leads", label: "Leads" },
          { href: "/coach/library", label: "Library" },
          { href: "/coach/programs", label: "Programs" },
          { href: "/coach/documents", label: "Documents" },
          { href: "/coach/settings", label: "Settings" },
        ]}
      />
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
