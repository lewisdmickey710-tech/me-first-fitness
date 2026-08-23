import { BackLink } from "@/components/back-link";
import { getMyClient } from "@/lib/current-client";
import { submitClientProfile } from "@/app/client/actions";
import { Button, Card, EmptyState, Heart, Input } from "@/components/ui";

export default async function ClientProfilePage() {
  const me = await getMyClient();

  if (!me) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Something went wrong linking your account. Reach out and I'll get it sorted."
      />
    );
  }

  const isFirstTime = !me.profile_completed_at;

  return (
    <div className="space-y-6">
      {!isFirstTime ? <BackLink href="/client/dashboard" /> : null}

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        {isFirstTime ? "Let's start with the basics" : "Your profile"}
      </h1>
      <p className="text-sm text-gray">
        {isFirstTime
          ? "Just your contact info to start — quick and easy. You can update any of this any time it changes."
          : "Update any of this any time it changes."}
      </p>

      <Card>
        <form action={submitClientProfile} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Full name
            </label>
            <Input name="name" required defaultValue={me.name} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Preferred name / nickname
            </label>
            <Input
              name="preferred_name"
              defaultValue={me.preferred_name ?? ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Date of birth
            </label>
            <Input
              name="date_of_birth"
              type="date"
              defaultValue={me.date_of_birth ?? ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Phone
            </label>
            <Input name="phone" defaultValue={me.phone ?? ""} />
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
              defaultValue={me.email ?? ""}
            />
          </div>

          <p className="pt-2 text-sm font-medium text-gray">
            Emergency contact
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Name
              </label>
              <Input
                name="emergency_contact_name"
                defaultValue={me.emergency_contact_name ?? ""}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Phone
              </label>
              <Input
                name="emergency_contact_phone"
                defaultValue={me.emergency_contact_phone ?? ""}
              />
            </div>
          </div>

          <p className="pt-2 text-sm font-medium text-gray">
            Physician / provider{" "}
            <span className="font-normal text-gray">(optional)</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Name
              </label>
              <Input
                name="physician_name"
                defaultValue={me.physician_name ?? ""}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Phone
              </label>
              <Input
                name="physician_phone"
                defaultValue={me.physician_phone ?? ""}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            {isFirstTime ? "Continue" : "Save"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
