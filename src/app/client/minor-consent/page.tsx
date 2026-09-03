import { BackLink } from "@/components/back-link";
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
import { makeT } from "@/lib/i18n";
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

  const t = makeT(me.language);
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
      <BackLink href="/client/documents" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        {t("Minor Consent & Intake Addendum")}
      </h1>
      <p className="text-sm text-gray">
        {t("Required in addition to the standard waiver — complete alongside your child's standard intake. To be filled out by a parent or legal guardian.")}
      </p>

      <form action={submitMinorConsent} className="space-y-6">
        <Card className="space-y-4">
          <SectionTitle>{t("Minor's information")}</SectionTitle>
          <Field label={t("Full name")}>
            <Input
              name="minor_full_name"
              defaultValue={consent?.minor_full_name ?? ""}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Date of birth")}>
              <Input
                name="minor_date_of_birth"
                type="date"
                defaultValue={consent?.minor_date_of_birth ?? ""}
              />
            </Field>
            <Field label={t("Age")}>
              <Input
                name="minor_age"
                type="number"
                min="0"
                defaultValue={consent?.minor_age ?? ""}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Grade")}>
              <Input name="minor_grade" defaultValue={consent?.minor_grade ?? ""} />
            </Field>
            <Field label={t("Sport(s)")}>
              <Input name="minor_sports" defaultValue={consent?.minor_sports ?? ""} />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t("Parent / guardian information")}</SectionTitle>
          <Field label={t("Full name")}>
            <Input
              name="guardian_full_name"
              defaultValue={consent?.guardian_full_name ?? ""}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Phone")}>
              <Input
                name="guardian_phone"
                defaultValue={consent?.guardian_phone ?? ""}
              />
            </Field>
            <Field label={t("Email")}>
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
          <Field label={t("Relationship to minor")}>
            <Input
              name="guardian_relationship"
              defaultValue={consent?.guardian_relationship ?? ""}
            />
          </Field>
          <Field label={t("Preferred way to hear about progress updates")}>
            <Select
              name="guardian_update_preference"
              defaultValue={consent?.guardian_update_preference ?? ""}
            >
              <option value="">{t("— Choose one —")}</option>
              <option value="text">{t("Text")}</option>
              <option value="email">{t("Email")}</option>
              <option value="in_person">{t("In-person after sessions")}</option>
            </Select>
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t("Emergency contact")}</SectionTitle>
          <p className="text-sm text-gray">
            {t("If different from the parent/guardian above.")}
          </p>
          <Field label={t("Name")}>
            <Input
              name="emergency_contact_name"
              defaultValue={consent?.emergency_contact_name ?? ""}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Relationship")}>
              <Input
                name="emergency_contact_relationship"
                defaultValue={consent?.emergency_contact_relationship ?? ""}
              />
            </Field>
            <Field label={t("Phone")}>
              <Input
                name="emergency_contact_phone"
                defaultValue={consent?.emergency_contact_phone ?? ""}
              />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t("Medical information")}</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Primary physician / pediatrician name")}>
              <Input
                name="physician_name"
                defaultValue={consent?.physician_name ?? ""}
              />
            </Field>
            <Field label={t("Physician phone")}>
              <Input
                name="physician_phone"
                defaultValue={consent?.physician_phone ?? ""}
              />
            </Field>
          </div>
          <Field label={t("Relevant diagnosis and current treatment (PT, bracing, rest protocol, etc.)")}>
            <Input
              name="diagnosis_treatment"
              defaultValue={consent?.diagnosis_treatment ?? ""}
            />
          </Field>
          <Field label={t("Other medical conditions, medications, or allergies")}>
            <Input
              name="other_conditions_meds_allergies"
              defaultValue={consent?.other_conditions_meds_allergies ?? ""}
            />
          </Field>
          <Field label={t("Athletic training clearance status")}>
            <Input
              name="athletic_training_clearance"
              defaultValue={consent?.athletic_training_clearance ?? ""}
            />
          </Field>
        </Card>

        {doc ? (
          <Card className="space-y-4">
            <SectionTitle>{t("Consent")}</SectionTitle>
            <DocumentBody text={doc.body} />
            <div className="space-y-3 border-t border-grayLt pt-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  {t("Parent/guardian signature — type your full legal name")}
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
                label={t("I have read and agree to the consent above")}
                defaultChecked={!!consent?.signed_at}
              />
            </div>
          </Card>
        ) : null}

        <Button type="submit" className="w-full">
          {consent?.signed_at ? t("Update & re-sign") : t("Sign & submit")}
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
