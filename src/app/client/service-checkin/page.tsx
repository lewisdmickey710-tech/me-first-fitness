import { BackLink } from "@/components/back-link";
import { submitServiceCheckin } from "@/app/client/actions";
import { Button, Card, Heart, Select, Textarea } from "@/components/ui";

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
              What&apos;s working well?
            </label>
            <Textarea name="what_working" rows={3} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              What would help right now?
            </label>
            <Textarea name="what_would_help" rows={3} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Anything else on your mind?
            </label>
            <Textarea name="anything_else" rows={3} />
          </div>

          <Button type="submit">Send to my coach</Button>
        </form>
      </Card>
    </div>
  );
}
