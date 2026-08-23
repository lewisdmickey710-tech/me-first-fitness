import { BackLink } from "@/components/back-link";
import { GuideContent } from "@/components/guide-content";

export default function ClientGuidePage() {
  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />
      <GuideContent />
    </div>
  );
}
