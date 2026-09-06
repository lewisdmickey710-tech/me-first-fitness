import { createClient } from "@/lib/supabase/server";
import {
  approveSlidingScaleApplication,
  declineSlidingScaleApplication,
} from "./actions";
import {
  Badge,
  Button,
  Card,
  Collapsible,
  EmptyState,
  Heart,
  Input,
  Textarea,
} from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import type { SlidingScaleApplication } from "@/lib/types";

export default async function SlidingScalePage() {
  const supabase = await createClient();

  const { data: applications } = (await supabase
    .from("sliding_scale_applications")
    .select("*")
    .order("created_at", { ascending: false })) as {
    data: SlidingScaleApplication[] | null;
  };

  const pending = (applications ?? []).filter((a) => a.status === "pending");
  const decided = (applications ?? []).filter((a) => a.status !== "pending");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Sliding Scale
      </h1>
      <p className="text-sm text-gray">
        Applications from the public sliding-scale page. Approving sets the
        rate you&apos;re offering them -- you&apos;ll still add them as a
        client from the roster yourself using that rate.
      </p>

      {pending.length === 0 ? (
        <EmptyState
          title="No pending applications"
          body="When someone applies for sliding scale, they'll show up here."
        />
      ) : (
        <div className="space-y-3">
          {pending.map((a) => (
            <Card key={a.id} className="space-y-3 border-gold/40 bg-gold/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">{a.name}</p>
                  <p className="text-sm text-gray">{a.email}</p>
                  {a.phone ? <p className="text-sm text-gray">{a.phone}</p> : null}
                </div>
                <p className="text-xs text-gray">{a.created_at.slice(0, 10)}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray">
                  Their situation
                </p>
                <p className="mt-0.5 text-sm text-ink">{a.situation}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray">
                  What would work for them
                </p>
                <p className="mt-0.5 text-sm text-ink">{a.what_would_work}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 border-t border-grayLt pt-3 sm:grid-cols-2">
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await approveSlidingScaleApplication(a.id, formData);
                  }}
                  className="space-y-2"
                >
                  <label className="block text-xs font-medium text-ink">
                    Approve at rate ($/session or /month)
                  </label>
                  <Input
                    name="approved_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 20"
                  />
                  <Input
                    name="coach_notes"
                    placeholder="Note to yourself (optional)"
                  />
                  <Button type="submit" variant="secondary">
                    Approve
                  </Button>
                </form>

                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await declineSlidingScaleApplication(a.id, formData);
                  }}
                  className="space-y-2"
                >
                  <label className="block text-xs font-medium text-ink">
                    Decline
                  </label>
                  <Textarea
                    name="coach_notes"
                    rows={2}
                    placeholder="Note to yourself (optional) -- never shown to them"
                  />
                  <ConfirmButton
                    variant="danger"
                    confirmText={`Decline ${a.name}'s sliding scale application?`}
                  >
                    Decline
                  </ConfirmButton>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}

      {decided.length > 0 ? (
        <Collapsible label={`Decided (${decided.length})`}>
          <div className="space-y-3">
            {decided.map((a) => (
              <Card key={a.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">{a.name}</p>
                    <p className="text-sm text-gray">{a.email}</p>
                  </div>
                  <Badge tone={a.status === "approved" ? "green" : "pink"}>
                    {a.status}
                    {a.status === "approved" && a.approved_rate
                      ? ` — $${Number(a.approved_rate).toFixed(2)}`
                      : ""}
                  </Badge>
                </div>
                {a.coach_notes ? (
                  <p className="mt-2 text-sm text-ink">{a.coach_notes}</p>
                ) : null}
              </Card>
            ))}
          </div>
        </Collapsible>
      ) : null}
    </div>
  );
}
