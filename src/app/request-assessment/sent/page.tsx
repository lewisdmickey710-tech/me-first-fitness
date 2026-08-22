import { Card, Heart } from "@/components/ui";

export default function AssessmentRequestSentPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm text-center">
        <Heart className="mb-2 inline-block text-lg" />
        <p className="font-medium text-ink">Got it — thank you</p>
        <p className="mt-2 text-sm text-gray">
          I&apos;ll be in touch soon to confirm a time. Check your email for a
          link to set up your own login — it&apos;s a quick way to tell me a
          little more about you before we meet, whenever&apos;s easiest for
          you.
        </p>
      </Card>
    </div>
  );
}
