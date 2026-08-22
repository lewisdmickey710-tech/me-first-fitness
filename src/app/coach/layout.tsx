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
          { href: "/coach/library", label: "Library" },
          { href: "/coach/programs", label: "Programs" },
        ]}
      />
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
