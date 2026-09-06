import { submitSlidingScaleApplication } from "./actions";
import { Button, Card, Heart, Input, Textarea } from "@/components/ui";

export default async function SlidingScalePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-12">
      {error ? (
        <div className="mb-4 w-full max-w-sm rounded-xl border border-pink/40 bg-pink/5 px-4 py-3 text-sm text-ink">
          <p className="font-medium">That didn&apos;t go through</p>
          <p className="mt-1 text-gray">{error}</p>
          <p className="mt-1 text-gray">
            Try again in a bit, or reach out directly if it keeps happening.
          </p>
        </div>
      ) : null}

      <div className="mb-8 max-w-md text-center">
        <h1 className="text-2xl font-semibold text-ink">
          <Heart className="mr-2" />
          Sliding Scale Application
        </h1>
        <p className="mt-3 text-sm text-ink">
          Cost should never be the reason you can&apos;t get support. If full
          price doesn&apos;t work for you right now, tell me a bit about your
          situation and I&apos;ll see what we can put together — there&apos;s
          no wrong answer here, and applying doesn&apos;t obligate you to
          anything.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <form action={submitSlidingScaleApplication} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Your name
            </label>
            <Input name="name" required placeholder="Full name" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Email
            </label>
            <Input
              name="email"
              type="text"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Phone <span className="font-normal text-gray">(optional)</span>
            </label>
            <Input name="phone" type="tel" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              What&apos;s going on, and what are you hoping for?
            </label>
            <Textarea
              name="situation"
              rows={4}
              required
              placeholder="Whatever you're comfortable sharing about your situation and your goals"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              What would feel sustainable for you?
            </label>
            <p className="mb-1.5 text-xs text-gray">
              Sliding scale often looks like meeting once a week in person
              for an hour, with the rest of your week programmed and tracked
              right here in the app on your own. What would work for
              you — how often we&apos;d meet, and what you could put toward
              it — and why?
            </p>
            <Textarea
              name="what_would_work"
              rows={4}
              required
              placeholder="e.g. Once a week in person would mean a lot, and $X/month is what I could realistically commit to right now because..."
            />
          </div>

          <Button type="submit" className="w-full">
            Submit application
          </Button>

          <p className="text-center text-xs text-gray">
            I&apos;ll read every application myself and follow up directly —
            usually within a few days.
          </p>
        </form>
      </Card>
    </div>
  );
}
