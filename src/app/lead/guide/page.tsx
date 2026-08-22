import Link from "next/link";
import { GuideContent } from "@/components/guide-content";

export default function LeadGuidePage() {
  return (
    <div className="space-y-6">
      <Link href="/lead/dashboard" className="text-sm text-gray hover:text-ink">
        ← Back
      </Link>
      <GuideContent />
    </div>
  );
}
