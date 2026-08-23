import { BackLink } from "@/components/back-link";
import { submitServiceCheckin } from "@/app/client/actions";
import { Button, Card, Checkbox, Heart, Select, Textarea } from "@/components/ui";

export default function ServiceCheckinPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <BackLink href="/client/documents" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        How&apos;s it going?
      </h1>
      <p className="text-sm text-gray">
        A quick monthly pulse check, separate from your daily check-ins.
        Honest is exactly what&apos;s useful here.
      </p>

      <Card>
        <form action={submitServiceCheckin} className="space-y-4">
          <input type="hidden" name="date" value={today} />

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Overall, how satisfied are you right now?
            </label>
            <Select name="satisfaction" required defaultValue="">
              <option value="" disabled>
                Choose one
              </option>
              <option value="5">5 — Loving it</option>
              <option value="4">4 — Good</option>
              <option value="3">3 — Okay</option>
              <option value="2">2 — Not great</option>
              <option value="1">1 — Struggling</option>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              What&apos;s changed for you since we started working together?
            </label>
            <Textarea
              name="what_working"
              rows={3}
              placeholder="Physically, mentally, day-to-day — whatever comes to mind"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              What would make this even better for you?
            </label>
            <Textarea name="what_would_help" rows={3} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Anything you&apos;d want to tell someone who&apos;s on the
              fence about working with a coach?
            </label>
            <Textarea name="anything_else" rows={3} />
          </div>

          <div className="border-t border-grayLt pt-4">
            <Checkbox
              name="testimonial_consent"
              label="I'm comfortable with Mickey sharing what I wrote above as a testimonial"
            />
            <p className="mt-1 text-xs text-gray">
              She&apos;ll always check with you first on specifics like using
              your name or photo — this just lets her know your words here
              are fair game to ask about.
            </p>
          </div>

          <Button type="submit">Send to my coach</Button>
        </form>
      </Card>
    </div>
  );
}
