import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyLead } from "@/lib/current-lead";
import { submitLeadIntake } from "@/app/lead/actions";
import {
  Button,
  Card,
  Checkbox,
  EmptyState,
  Heart,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import type { LeadIntake } from "@/lib/types";

const PAIN_TYPES = ["Sharp", "Dull/achy", "Burning", "Tingling/numb", "Stiff"];

export default async function LeadIntakePage() {
  const lead = await getMyLead();

  if (!lead) {
    return (
      <EmptyState
        title="No profile linked yet"
        body="Something went wrong linking your account. Reach out and I'll get it sorted."
      />
    );
  }

  const supabase = await createClient();
  const { data: intake } = (await supabase
    .from("lead_intake")
    .select("*")
    .eq("lead_id", lead.id)
    .maybeSingle()) as { data: LeadIntake | null };

  const painTypes = new Set(intake?.pain_type ?? []);

  return (
    <div className="space-y-6">
      <Link href="/lead/dashboard" className="text-sm text-gray hover:text-ink">
        ← Back
      </Link>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        A little about you
      </h1>
      <p className="text-sm text-gray">
        Nothing here is a test, and there&apos;s no wrong way to answer any
        of it. I just want to actually know you — your body, your history,
        your life — before we ever meet in person. Take your time, answer as
        honestly as you can, and don&apos;t worry about getting it
        &quot;right.&quot;
      </p>

      <form action={submitLeadIntake} className="space-y-6">
        <Card className="space-y-4">
          <SectionTitle>You</SectionTitle>
          <Field label="Date of birth">
            <Input
              name="date_of_birth"
              type="date"
              defaultValue={intake?.date_of_birth ?? ""}
            />
          </Field>
          <Field label="What brought you to MeFirstFitness">
            <Textarea
              name="why_here"
              rows={2}
              defaultValue={intake?.why_here ?? ""}
            />
          </Field>
          <Field label="What would make this feel worthwhile a year from now">
            <Textarea
              name="why_worthwhile"
              rows={2}
              defaultValue={intake?.why_worthwhile ?? ""}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Balance &amp; falls</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              name="fall_past_year"
              label="A fall in the past year"
              defaultChecked={intake?.fall_past_year}
            />
            <Checkbox
              name="near_fall"
              label="A near-fall / stumble"
              defaultChecked={intake?.near_fall}
            />
            <Checkbox
              name="fear_of_falling"
              label="Some fear of falling"
              defaultChecked={intake?.fear_of_falling}
            />
          </div>
          <Field label="If you checked one of those, tell me a little about what happened">
            <Textarea
              name="balance_notes"
              rows={2}
              defaultValue={intake?.balance_notes ?? ""}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Bones &amp; joints</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              name="osteoporosis"
              label="Osteoporosis/osteopenia"
              defaultChecked={intake?.osteoporosis}
            />
            <Checkbox
              name="joint_replacement"
              label="A joint replacement"
              defaultChecked={intake?.joint_replacement}
            />
            <Checkbox
              name="arthritis"
              label="Arthritis"
              defaultChecked={intake?.arthritis}
            />
          </div>
          <Field label="Anything you'd add — which joint, when, how it is now">
            <Textarea
              name="bones_notes"
              rows={2}
              defaultValue={intake?.bones_notes ?? ""}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Medications &amp; your doctor</SectionTitle>
          <Field label="Medications worth knowing about (blood pressure, blood thinners, etc.)">
            <Textarea
              name="medications"
              rows={2}
              defaultValue={intake?.medications ?? ""}
            />
          </Field>
          <Field label="Your doctor's name, if you'd like me to be able to reach them">
            <Input name="doctor_name" defaultValue={intake?.doctor_name ?? ""} />
          </Field>
          <Field label="Medical clearance to train">
            <Select
              name="medical_clearance"
              defaultValue={intake?.medical_clearance ?? ""}
            >
              <option value="">— Choose one —</option>
              <option value="have_clearance">
                I&apos;ve already gotten clearance to train
              </option>
              <option value="in_progress">I&apos;m still working on that</option>
              <option value="not_needed">I haven&apos;t needed to</option>
            </Select>
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Day to day</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              name="lives_alone"
              label="I live alone"
              defaultChecked={intake?.lives_alone}
            />
            <Checkbox
              name="drives_self"
              label="I still drive myself everywhere"
              defaultChecked={intake?.drives_self}
            />
            <Checkbox
              name="stairs_daily"
              label="Stairs are part of my daily life"
              defaultChecked={intake?.stairs_daily}
            />
          </div>
          <Field label="Anything that feels harder these days than it used to">
            <Textarea
              name="day_to_day_notes"
              rows={2}
              defaultValue={intake?.day_to_day_notes ?? ""}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Where pain lives right now</SectionTitle>
          <p className="text-sm text-gray">
            My goal from day one is training around pain, never through it.
            Pain is information for me, not something for you to push
            through.
          </p>
          <Field label="Where you feel pain right now, in your own words">
            <Textarea
              name="pain_location"
              rows={2}
              defaultValue={intake?.pain_location ?? ""}
            />
          </Field>
          <Field label="How long this has been going on">
            <Input
              name="pain_duration"
              defaultValue={intake?.pain_duration ?? ""}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="What tends to make it better">
              <Textarea
                name="pain_better"
                rows={2}
                defaultValue={intake?.pain_better ?? ""}
              />
            </Field>
            <Field label="What tends to make it worse">
              <Textarea
                name="pain_worse"
                rows={2}
                defaultValue={intake?.pain_worse ?? ""}
              />
            </Field>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-ink">
              What kind of pain, if any
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PAIN_TYPES.map((t) => (
                <Checkbox
                  key={t}
                  name="pain_type"
                  value={t}
                  label={t}
                  defaultChecked={painTypes.has(t)}
                />
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Right now, on a scale of 1–10</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Energy">
              <Input
                name="energy_scale"
                type="number"
                min="1"
                max="10"
                defaultValue={intake?.energy_scale ?? ""}
              />
            </Field>
            <Field label="Sleep quality">
              <Input
                name="sleep_scale"
                type="number"
                min="1"
                max="10"
                defaultValue={intake?.sleep_scale ?? ""}
              />
            </Field>
            <Field label="Stress">
              <Input
                name="stress_scale"
                type="number"
                min="1"
                max="10"
                defaultValue={intake?.stress_scale ?? ""}
              />
            </Field>
            <Field label="Confidence in your body">
              <Input
                name="confidence_scale"
                type="number"
                min="1"
                max="10"
                defaultValue={intake?.confidence_scale ?? ""}
              />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Nutrition</SectionTitle>
          <Field label="Your relationship with food right now">
            <Select
              name="nutrition_relationship"
              defaultValue={intake?.nutrition_relationship ?? ""}
            >
              <option value="">— Choose one —</option>
              <option value="comfortable">Comfortable</option>
              <option value="complicated">Complicated</option>
              <option value="actively_working">Actively working on it</option>
              <option value="rather_not_say">Rather not say</option>
            </Select>
          </Field>
          <Field label="Anything about food you'd want me to know">
            <Textarea
              name="nutrition_notes"
              rows={2}
              defaultValue={intake?.nutrition_notes ?? ""}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Lifestyle</SectionTitle>
          <Field label="Who or what supports you on this journey">
            <Textarea
              name="support_system"
              rows={2}
              defaultValue={intake?.support_system ?? ""}
            />
          </Field>
          <Field label="What's the biggest competing demand on your time">
            <Textarea
              name="competing_demands"
              rows={2}
              defaultValue={intake?.competing_demands ?? ""}
            />
          </Field>
        </Card>

        <Button type="submit" className="w-full">
          {intake?.submitted_at ? "Update my answers" : "Submit"}
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
