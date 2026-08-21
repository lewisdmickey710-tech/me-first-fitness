import Link from "next/link";
import { submitRequest } from "@/app/client/actions";
import { Button, Card, Heart, Input, Textarea } from "@/components/ui";

export default function RequestTimePage() {
  return (
    <div className="space-y-6">
      <Link
        href="/client/dashboard"
        className="text-sm text-gray hover:text-ink"
      >
        ← Back
      </Link>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Request a session time
      </h1>
      <p className="text-sm text-gray">
        Propose a time that works for you — your coach will confirm or
        suggest another.
      </p>

      <Card>
        <form action={submitRequest} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Preferred date
              </label>
              <Input name="preferred_date" type="date" required />
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
              Note
            </label>
            <Textarea
              name="note"
              rows={3}
              placeholder="Anything your coach should know"
            />
          </div>

          <Button type="submit">Send request</Button>
        </form>
      </Card>
    </div>
  );
}
