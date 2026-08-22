import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { submitMinorConsent } from "@/app/client/actions";
import {
  Button,
  Card,
  Checkbox,
  DocumentBody,
  EmptyState,
  Heart,
  Input,
  Select,
} from "@/components/ui";
import type { ClientMinorConsent, LegalDocument } from "@/lib/types";

export default async function MinorConsentPage() {
  const me = await getMyClient();

  if (!me) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Something went wrong linking your account. Reach out and I'll get it sorted."
      />
    );
  }

  const supabase = await createClient();

  const [{ data: doc }, { data: consent }] = await Promise.all([
    supabase
      .from("legal_documents")
      .select("*")
      .eq("key", "minor_consent")
      .maybeSingle() as unknown as Promise<{ data: LegalDocument | null }>,
    supabase
      .from("client_minor_consent")
      .select("*")
      .eq("client_id", me.id)
      .maybeSingle() as unknown as Promise<{ data: ClientMinorConsent | null }>,
  ]);

  return (
    <div className="space-y-6">
      <Link href="/client/documents" className="text-sm text-gray hover:text-ink">
        ← Back
      </Link>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        Minor Consent &amp; Intake Addendum
      </h1>
      <p className="text-sm text-gray">
        Required in addition to the standard waiver — complete alongside
        your child&apos;s standard intake. To be filled out by a parent or
        legal guardian.
      </p>

      <form action={submitMinorConsent} className="space-y-6">
        <Card className="space-y-4">
          <SectionTitle>Minor&apos;s information</SectionTitle>
          <Field label="Full name">
            <Input
              name="minor_full_name"
              defaultValue={consent?.minor_full_name ?? ""}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of birth">
              <Input
                name="minor_date_of_birth"
                type="date"
                defaultValue={consent?.minor_date_of_birth ?? ""}
              />
            </Field>
            <Field label="Age">
              <Input
                name="minor_age"
                type="number"
                min="0"
                defaultValue={consent?.minor_age ?? ""}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Grade">
              <Input name="minor_grade" defaultValue={consent?.minor_grade ?? ""} />
            </Field>
            <Field label="Sport(s)">
              <Input name="minor_sports" defaultValue={consent?.minor_sports ?? ""} />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Parent / guardian information</SectionTitle>
          <Field label="Full name">
            <Input
              name="guardian_full_name"
              defaultValue={consent?.guardian_full_name ?? ""}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <Input
                name="guardian_phone"
                defaultValue={consent?.guardian_phone ?? ""}
              />
            </Field>
            <Field label="Email">
              <Input
                name="guardian_email"
                type="text"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                defaultValue={consent?.guardian_email ?? ""}
              />
            </Field>
          </div>
          <Field label="Relationship to minor">
            <Input
              name="guardian_relationship"
              defaultValue={consent?.guardian_relationship ?? ""}
            />
          </Field>
          <Field label="Preferred way to hear about progress updates">
            <Select
              name="guardian_update_preference"
              defaultValue={consent?.guardian_update_preference ?? ""}
            >
              <option value="">— Choose one —</option>
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="in_person">In-person after sessions</option>
            </Select>
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Emergency contact</SectionTitle>
          <p className="text-sm text-gray">
            If different from the parent/guardian above.
          </p>
          <Field label="Name">
            <Input
              name="emergency_contact_name"
              defaultValue={consent?.emergency_contact_name ?? ""}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Relationship">
              <Input
                name="emergency_contact_relationship"
                defaultValue={consent?.emergency_contact_relationship ?? ""}
              />
            </Field>
            <Field label="Phone">
              <Input
                name="emergency_contact_phone"
                defaultValue={consent?.emergency_contact_phone ?? ""}
              />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Medical information</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary physician / pediatrician name">
              <Input
                name="physician_name"
                defaultValue={consent?.physician_name ?? ""}
              />
            </Field>
            <Field label="Physician phone">
              <Input
                name="physician_phone"
                defaultValue={consent?.physician_phone ?? ""}
              />
            </Field>
          </div>
          <Field label="Relevant diagnosis and current treatment (PT, bracing, rest protocol, etc.)">
            <Input
              name="diagnosis_treatment"
              defaultValue={consent?.diagnosis_treatment ?? ""}
            />
          </Field>
          <Field label="Other medical conditions, medications, or allergies">
            <Input
              name="other_conditions_meds_allergies"
              defaultValue={consent?.other_conditions_meds_allergies ?? ""}
            />
          </Field>
          <Field label="Athletic training clearance status">
            <Input
              name="athletic_training_clearance"
              defaultValue={consent?.athletic_training_clearance ?? ""}
            />
          </Field>
        </Card>

        {doc ? (
          <Card className="space-y-4">
            <SectionTitle>Consent</SectionTitle>
            <DocumentBody text={doc.body} />
            <div className="space-y-3 border-t border-grayLt pt-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Parent/guardian signature — type your full legal name
                </label>
                <Input
                  name="guardian_signature_name"
                  required
                  defaultValue={consent?.guardian_signature_name ?? ""}
                />
              </div>
              <Checkbox
                name="consent"
                required
                label="I have read and agree to the consent above"
                defaultChecked={!!consent?.signed_at}
              />
            </div>
          </Card>
        ) : null}

        <Button type="submit" className="w-full">
          {consent?.signed_at ? "Update & re-sign" : "Sign & submit"}
        </Button>
      </form>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="font-medium text-rose">{children}</p>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}
