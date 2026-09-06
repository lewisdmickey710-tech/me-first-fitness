import { Card, Heart } from "@/components/ui";

export default function SlidingScaleSentPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm text-center">
        <Heart className="mb-2 inline-block text-lg" />
        <p className="font-medium text-ink">Got it — thank you</p>
        <p className="mt-2 text-sm text-gray">
          I&apos;ll read through what you shared and follow up directly at
          the email you gave me, usually within a few days.
        </p>
      </Card>
    </div>
  );
}
