import { TopNav } from "@/components/nav";
import { getMyClient } from "@/lib/current-client";

export default async function ClientAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getMyClient();

  return (
    <div className="min-h-screen">
      <TopNav title="MeFirstFitness" faqHref="/client/faq" locale={me?.language} />
      <main className="mx-auto max-w-xl px-4 py-6">{children}</main>
    </div>
  );
}
