import Link from "next/link";
import { GuideContent } from "@/components/guide-content";

export default function ClientGuidePage() {
  return (
    <div className="space-y-6">
      <Link
        href="/client/dashboard"
        className="text-sm text-gray hover:text-ink"
      >
        ← Back
      </Link>
      <GuideContent />
    </div>
  );
}
