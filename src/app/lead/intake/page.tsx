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

      <div className="rounded-xl border border-rose/30 bg-rose/5 p-3 text-sm text-ink">
        <strong>Heads up:</strong> this takes most people about 15–20
        minutes. Set aside a quiet block of time so you can answer
        thoroughly — the more I know going in, the better I can build
        around you.
      </div>

      <form action={submitLeadIntake} className="space-y-6">
        <Card className="space-y-4">
          <SectionTitle>You</SectionTitle>
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
          <SectionTitle>Your body right now</SectionTitle>
          <Field label="How would you describe your current fitness level?">
            <Select
              name="fitness_level"
              defaultValue={intake?.fitness_level ?? ""}
            >
              <option value="">— Choose one —</option>
              <option value="complete_beginner">Complete beginner</option>
              <option value="some_experience">Some experience</option>
              <option value="moderately_active">Moderately active</option>
              <option value="previously_very_active">
                Previously very active
              </option>
              <option value="athlete_competitive">
                Athlete / competitive
              </option>
            </Select>
          </Field>
          <Field label="Current satisfaction with how your body feels (1 = very dissatisfied, 10 = completely at ease)">
            <Input
              name="body_satisfaction_scale"
              type="number"
              min="1"
              max="10"
              defaultValue={intake?.body_satisfaction_scale ?? ""}
            />
          </Field>
          <Field label="Areas of your body that feel strong or capable">
            <Textarea
              name="strong_areas"
              rows={2}
              defaultValue={intake?.strong_areas ?? ""}
            />
          </Field>
          <Field label="Any injuries, surgeries, or physical limitations Mickey should know about">
            <Textarea
              name="injuries_limitations"
              rows={2}
              defaultValue={intake?.injuries_limitations ?? ""}
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
          <SectionTitle>Bones, joints &amp; chronic conditions</SectionTitle>
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
            <Checkbox
              name="hypermobility"
              label="Hypermobility"
              defaultChecked={intake?.hypermobility}
            />
            <Checkbox
              name="pots_dysautonomia"
              label="POTS/dysautonomia"
              defaultChecked={intake?.pots_dysautonomia}
            />
            <Checkbox
              name="mcas"
              label="MCAS"
              defaultChecked={intake?.mcas}
            />
            <Checkbox
              name="autoimmune_condition"
              label="Autoimmune condition"
              defaultChecked={intake?.autoimmune_condition}
            />
          </div>
          <Field label="Anything you'd add — which condition or joint, and how it is now">
            <Textarea
              name="bones_notes"
              rows={2}
              defaultValue={intake?.bones_notes ?? ""}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>General health history</SectionTitle>
          <p className="text-sm text-gray">Check all that apply:</p>
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              name="heart_condition"
              label="Heart condition"
              defaultChecked={intake?.heart_condition}
            />
            <Checkbox
              name="high_blood_pressure"
              label="High blood pressure"
              defaultChecked={intake?.high_blood_pressure}
            />
            <Checkbox
              name="diabetes"
              label="Diabetes"
              defaultChecked={intake?.diabetes}
            />
            <Checkbox
              name="asthma"
              label="Asthma"
              defaultChecked={intake?.asthma}
            />
            <Checkbox
              name="thyroid_condition"
              label="Thyroid condition"
              defaultChecked={intake?.thyroid_condition}
            />
            <Checkbox
              name="joint_issues"
              label="Joint issues"
              defaultChecked={intake?.joint_issues}
            />
            <Checkbox
              name="anxiety_depression"
              label="Anxiety / depression"
              defaultChecked={intake?.anxiety_depression}
            />
            <Checkbox
              name="eating_disorder_history"
              label="Eating disorder history"
              defaultChecked={intake?.eating_disorder_history}
            />
            <Checkbox
              name="pregnancy_postpartum"
              label="Pregnancy / postpartum"
              defaultChecked={intake?.pregnancy_postpartum}
            />
          </div>
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
          <SectionTitle>Your goals</SectionTitle>
          <Field label="In your own words, what do you most want to change or feel differently about?">
            <Textarea
              name="goal_change_description"
              rows={2}
              defaultValue={intake?.goal_change_description ?? ""}
            />
          </Field>
          <Field label="What does success look like to you 3 months from now?">
            <Textarea
              name="goal_success_3_months"
              rows={2}
              defaultValue={intake?.goal_success_3_months ?? ""}
            />
          </Field>
          <Field label="What has held you back from reaching your goals before?">
            <Textarea
              name="goal_held_back_before"
              rows={2}
              defaultValue={intake?.goal_held_back_before ?? ""}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Goal importance (1 = not very important, 10 = top priority)">
              <Input
                name="goal_importance_scale"
                type="number"
                min="1"
                max="10"
                defaultValue={intake?.goal_importance_scale ?? ""}
              />
            </Field>
            <Field label="Confidence to change (1 = not confident, 10 = fully ready)">
              <Input
                name="confidence_to_change_scale"
                type="number"
                min="1"
                max="10"
                defaultValue={intake?.confidence_to_change_scale ?? ""}
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
          <Field label="Foods you love that you'd never want to give up">
            <Textarea
              name="foods_loved"
              rows={2}
              defaultValue={intake?.foods_loved ?? ""}
            />
          </Field>
          <Field label="Foods that feel scary, forbidden, or guilt-inducing">
            <Textarea
              name="foods_scary"
              rows={2}
              defaultValue={intake?.foods_scary ?? ""}
            />
          </Field>
          <Field label="Have you ever been on a structured diet or weight loss program?">
            <Select name="diet_history" defaultValue={intake?.diet_history ?? ""}>
              <option value="">— Choose one —</option>
              <option value="never">Never</option>
              <option value="once_or_twice">Once or twice</option>
              <option value="many_times">Many times</option>
              <option value="currently_on_one">Currently on one</option>
            </Select>
          </Field>
          <Field label="How much does food stress affect your daily mood? (1 = not at all, 10 = significantly every day)">
            <Input
              name="food_stress_scale"
              type="number"
              min="1"
              max="10"
              defaultValue={intake?.food_stress_scale ?? ""}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Average sleep per night">
              <Input
                name="average_sleep_hours"
                defaultValue={intake?.average_sleep_hours ?? ""}
              />
            </Field>
            <Field label="How long have you slept this way?">
              <Input
                name="sleep_duration_pattern"
                defaultValue={intake?.sleep_duration_pattern ?? ""}
              />
            </Field>
          </div>
          <Field label="Main sources of stress in your life right now">
            <Textarea
              name="stress_sources"
              rows={2}
              defaultValue={intake?.stress_sources ?? ""}
            />
          </Field>
          <Field label="How do you typically cope with stress?">
            <Textarea
              name="stress_coping"
              rows={2}
              defaultValue={intake?.stress_coping ?? ""}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>How you like to be coached</SectionTitle>
          <Field label="How do you like to be coached during a session?">
            <Select
              name="coaching_style"
              defaultValue={intake?.coaching_style ?? ""}
            >
              <option value="">— Choose one —</option>
              <option value="lots_of_encouragement">
                Lots of encouragement
              </option>
              <option value="push_me_challenge_me">
                Push me / challenge me
              </option>
              <option value="quiet_and_focused">Quiet and focused</option>
              <option value="flexible_read_my_mood">
                Flexible — read my mood
              </option>
            </Select>
          </Field>
          <Field label="How do you prefer feedback in the moment?">
            <Select
              name="feedback_style"
              defaultValue={intake?.feedback_style ?? ""}
            >
              <option value="">— Choose one —</option>
              <option value="direct_and_honest">Direct and honest</option>
              <option value="mix_of_both">Mix of both</option>
              <option value="gentle_and_encouraging">
                Gentle and encouraging
              </option>
              <option value="mostly_positive_correct_big_issues">
                Mostly positive, correct only big issues
              </option>
            </Select>
          </Field>
          <Field label="Best way to reach you between sessions?">
            <Select
              name="contact_method"
              defaultValue={intake?.contact_method ?? ""}
            >
              <option value="">— Choose one —</option>
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="call">Call</option>
              <option value="reach_out_if_needed">
                I&apos;ll reach out if needed
              </option>
            </Select>
          </Field>
          <Field label="How often would you like check-ins between sessions?">
            <Select
              name="checkin_frequency"
              defaultValue={intake?.checkin_frequency ?? ""}
            >
              <option value="">— Choose one —</option>
              <option value="weekly">Weekly</option>
              <option value="every_session_only">Every session only</option>
              <option value="only_if_i_reach_out">Only if I reach out</option>
              <option value="not_at_all_session_time_only">
                Not at all, just session time
              </option>
            </Select>
          </Field>
          <Field label="What kind of accountability helps you most?">
            <Select
              name="accountability_style"
              defaultValue={intake?.accountability_style ?? ""}
            >
              <option value="">— Choose one —</option>
              <option value="regular_checkins_from_mickey">
                Regular check-ins from Mickey
              </option>
              <option value="tracking_own_progress">
                Tracking my own progress
              </option>
              <option value="scheduled_sessions_enough">
                Scheduled sessions are enough
              </option>
              <option value="friendly_reminders_nudges">
                Friendly reminders / nudges
              </option>
            </Select>
          </Field>
          <Field label="Anything that has NOT worked for you with past coaches or trainers">
            <Textarea
              name="past_coach_what_didnt_work"
              rows={2}
              defaultValue={intake?.past_coach_what_didnt_work ?? ""}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Anything else?</SectionTitle>
          <Field label="Is there anything else you'd like Mickey to know before your assessment session?">
            <Textarea
              name="anything_else"
              rows={2}
              defaultValue={intake?.anything_else ?? ""}
            />
          </Field>
          <Field label="How did you hear about MeFirstFitness?">
            <Select
              name="referral_source"
              defaultValue={intake?.referral_source ?? ""}
            >
              <option value="">— Choose one —</option>
              <option value="friend_family">Friend / family referral</option>
              <option value="social_media">Social media</option>
              <option value="flyer">Flyer</option>
              <option value="google">Google</option>
              <option value="other">Other</option>
            </Select>
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
