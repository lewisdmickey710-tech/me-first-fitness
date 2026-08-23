import { submitAssessmentRequest } from "./actions";
import { Button, Card, Heart, Input, Textarea } from "@/components/ui";

export default async function RequestAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

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
          MeFirstFitness
        </h1>
        <p className="mt-1 text-sm text-gray">Mind &amp; Muscle Mechanics</p>
        <p className="mt-3 text-lg font-medium text-rose">
          Feel Strong. Feel Free. Feel You.
        </p>
        <p className="mt-4 text-sm text-ink">
          Every new client starts with a free assessment — movement,
          posture &amp; goals — then 50% off your first paid session after
          you sign on. No pressure, no obligation. It&apos;s just a chance
          for us to actually meet, for me to understand your body and your
          goals, and for you to see if working together feels right.
        </p>
        <p className="mt-3 text-xs text-gray">
          $40/session in-person · $25/session virtual · $50 self-led plan
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <form action={submitAssessmentRequest} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Preferred date
              </label>
              <Input
                name="preferred_date"
                type="date"
                required
                min={today}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Preferred time{" "}
                <span className="font-normal text-gray">(optional)</span>
              </label>
              <Input name="preferred_time" type="time" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Anything you&apos;d like me to know?{" "}
              <span className="font-normal text-gray">(optional)</span>
            </label>
            <Textarea
              name="note"
              rows={3}
              placeholder="What brought you here, any goals, anything at all"
            />
          </div>

          <Button type="submit" className="w-full">
            Request my assessment
          </Button>

          <p className="text-center text-xs text-gray">
            This is a request, not a booking — I&apos;ll confirm a time with
            you directly. You&apos;ll also get an email to set up your own
            login, where you can fill out a bit more before we meet.
          </p>
        </form>
      </Card>
    </div>
  );
}
