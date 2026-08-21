import { TopNav } from "@/components/nav";

export default function ClientAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <TopNav title="MeFirstFitness" />
      <main className="mx-auto max-w-xl px-4 py-6">{children}</main>
    </div>
  );
}
