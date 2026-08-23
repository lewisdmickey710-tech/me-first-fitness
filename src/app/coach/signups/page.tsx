import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  addClientForAccount,
  linkExistingClientToAccount,
  rejectSignup,
} from "@/app/coach/actions";
import {
  Button,
  Card,
  Collapsible,
  EmptyState,
  Heart,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import type { CareProfile, Client } from "@/lib/types";
import { CareProfilePicker } from "@/app/coach/roster/new/CareProfilePicker";

export default async function CoachSignupsPage() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: clients }, { data: careProfiles }] =
    await Promise.all([
      supabase.from("profiles").select("id, created_at").eq("role", "client"),
      supabase.from("clients").select("*") as unknown as Promise<{
        data: Client[] | null;
      }>,
      supabase.from("care_profiles").select("*").order("name") as unknown as Promise<{
        data: CareProfile[] | null;
      }>,
    ]);

  const linkedUserIds = new Set(
    (clients ?? []).filter((c) => c.user_id).map((c) => c.user_id)
  );
  const pendingProfiles = (profiles ?? []).filter(
    (p) => !linkedUserIds.has(p.id)
  );
  const unlinkedClients = (clients ?? []).filter((c) => !c.user_id);

  const admin = createAdminClient();
  const pendingAccounts = await Promise.all(
    pendingProfiles.map(async (p) => {
      const { data } = await admin.auth.admin.getUserById(p.id);
      return {
        userId: p.id,
        email: data?.user?.email ?? "(no email found)",
        createdAt: p.created_at,
      };
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        New signups
      </h1>
      <p className="text-sm text-gray">
        Anyone who logs in with a new email through the client tab lands
        here until you either add them as a new client or link them to a
        client you&apos;ve already added.
      </p>

      {pendingAccounts.length === 0 ? (
        <EmptyState
          title="Nothing waiting"
          body="Every signed-in client account is linked to a client profile."
        />
      ) : (
        <div className="space-y-4">
          {pendingAccounts.map((account) => (
            <Card key={account.userId} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">{account.email}</p>
                  <p className="text-sm text-gray">
                    Signed up {account.createdAt.slice(0, 10)}
                  </p>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await rejectSignup(account.userId);
                  }}
                >
                  <Button type="submit" variant="danger">
                    Reject
                  </Button>
                </form>
              </div>

              <Collapsible label="+ Add as a new client">
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await addClientForAccount(account.userId, formData);
                  }}
                  className="mt-2 space-y-3"
                >
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink">
                      Name
                    </label>
                    <Input
                      name="name"
                      required
                      placeholder="Client's full name"
                    />
                  </div>
                  <CareProfilePicker careProfiles={careProfiles ?? []} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-ink">
                        Days per week
                      </label>
                      <Select name="days_per_week" defaultValue="3">
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-ink">
                        Session mode
                      </label>
                      <Select name="session_mode" defaultValue="in_person">
                        <option value="in_person">In-person</option>
                        <option value="virtual">Virtual</option>
                        <option value="mixed">Mixed</option>
                        <option value="virtual_async">Fully virtual — async</option>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink">
                      Sessions allotted{" "}
                      <span className="font-normal text-gray">
                        (optional)
                      </span>
                    </label>
                    <Input
                      name="sessions_allotted"
                      type="number"
                      min="0"
                      placeholder="e.g. 12"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink">
                      Notes{" "}
                      <span className="font-normal text-gray">
                        (coach-only)
                      </span>
                    </label>
                    <Textarea name="notes" rows={2} />
                  </div>
                  <Button type="submit">Add &amp; link</Button>
                </form>
              </Collapsible>

              {unlinkedClients.length > 0 ? (
                <Collapsible label="Or link to a client you already added">
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      const clientId = String(
                        formData.get("client_id") ?? ""
                      );
                      if (!clientId) throw new Error("Choose a client.");
                      await linkExistingClientToAccount(
                        account.userId,
                        clientId
                      );
                    }}
                    className="mt-2 flex flex-wrap items-end gap-2"
                  >
                    <Select name="client_id" defaultValue="" required>
                      <option value="" disabled>
                        Choose a client
                      </option>
                      {unlinkedClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" variant="secondary">
                      Link
                    </Button>
                  </form>
                </Collapsible>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
