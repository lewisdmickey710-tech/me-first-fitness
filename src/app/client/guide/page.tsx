import { BackLink } from "@/components/back-link";
import { getMyClient } from "@/lib/current-client";
import { GuideContent } from "@/components/guide-content";
import { GuideContentEs } from "@/components/guide-content-es";

export default async function ClientGuidePage() {
  const me = await getMyClient();

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />
      {me?.language === "es" ? <GuideContentEs /> : <GuideContent />}
    </div>
  );
}
