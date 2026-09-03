import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { getMyClient } from "@/lib/current-client";
import { submitClientIntake } from "@/app/client/actions";
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
import { makeT } from "@/lib/i18n";
import type { ClientIntake } from "@/lib/types";

const PAIN_TYPES = ["Sharp", "Dull/achy", "Burning", "Tingling/numb", "Stiff"];

export default async function ClientIntakePage() {
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
  const { data: intake } = (await supabase
    .from("client_intake")
    .select("*")
    .eq("client_id", me.id)
    .maybeSingle()) as { data: ClientIntake | null };

  const painTypes = new Set(intake?.pain_type ?? []);

  return (
    <div className="space-y-6">
      <BackLink href="/client/dashboard" />

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        {t("A little about you")}
      </h1>
      <p className="text-sm text-gray">
        {t(
          'Nothing here is a test, and there\'s no wrong way to answer any of it. This helps me know you more fully — your body, your history, your life — beyond what we\'ve already covered together. Take your time, answer as honestly as you can, and don\'t worry about getting it "right." Update it any time something changes.'
        )}
      </p>

      <form action={submitClientIntake} className="space-y-6">
        <Card className="space-y-4">
          <SectionTitle>{t("You")}</SectionTitle>
          <Field label={t("What brought you to MeFirstFitness")}>
            <Textarea
              name="why_here"
              rows={2}
              defaultValue={intake?.why_here ?? ""}
            />
          </Field>
          <Field label={t("What would make this feel worthwhile a year from now")}>
            <Textarea
              name="why_worthwhile"
              rows={2}
              defaultValue={intake?.why_worthwhile ?? ""}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t("Your body right now")}</SectionTitle>
          <Field label={t("How would you describe your current fitness level?")}>
            <Select
              name="fitness_level"
              defaultValue={intake?.fitness_level ?? ""}
            >
              <option value="">{t("— Choose one —")}</option>
              <option value="complete_beginner">{t("Complete beginner")}</option>
              <option value="some_experience">{t("Some experience")}</option>
              <option value="moderately_active">{t("Moderately active")}</option>
              <option value="previously_very_active">
                {t("Previously very active")}
              </option>
              <option value="athlete_competitive">
                {t("Athlete / competitive")}
              </option>
            </Select>
          </Field>
          <Field label={t("Current satisfaction with how your body feels (1 = very dissatisfied, 10 = completely at ease)")}>
            <Input
              name="body_satisfaction_scale"
              type="number"
              min="1"
              max="10"
              defaultValue={intake?.body_satisfaction_scale ?? ""}
            />
          </Field>
          <Field label={t("Areas of your body that feel strong or capable")}>
            <Textarea
              name="strong_areas"
              rows={2}
              defaultValue={intake?.strong_areas ?? ""}
            />
          </Field>
          <Field label={t("Any injuries, surgeries, or physical limitations Mickey should know about")}>
            <Textarea
              name="injuries_limitations"
              rows={2}
              defaultValue={intake?.injuries_limitations ?? ""}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t("Balance & falls")}</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              name="fall_past_year"
              label={t("A fall in the past year")}
              defaultChecked={intake?.fall_past_year}
            />
            <Checkbox
              name="near_fall"
              label={t("A near-fall / stumble")}
              defaultChecked={intake?.near_fall}
            />
            <Checkbox
              name="fear_of_falling"
              label={t("Some fear of falling")}
              defaultChecked={intake?.fear_of_falling}
            />
          </div>
          <Field label={t("If you checked one of those, tell me a little about what happened")}>
            <Textarea
              name="balance_notes"
              rows={2}
              defaultValue={intake?.balance_notes ?? ""}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t("Bones, joints & chronic conditions")}</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              name="osteoporosis"
              label={t("Osteoporosis/osteopenia")}
              defaultChecked={intake?.osteoporosis}
            />
            <Checkbox
              name="joint_replacement"
              label={t("A joint replacement")}
              defaultChecked={intake?.joint_replacement}
            />
            <Checkbox
              name="arthritis"
              label={t("Arthritis")}
              defaultChecked={intake?.arthritis}
            />
            <Checkbox
              name="hypermobility"
              label={t("Hypermobility")}
              defaultChecked={intake?.hypermobility}
            />
            <Checkbox
              name="pots_dysautonomia"
              label={t("POTS/dysautonomia")}
              defaultChecked={intake?.pots_dysautonomia}
            />
            <Checkbox
              name="mcas"
              label={t("MCAS")}
              defaultChecked={intake?.mcas}
            />
            <Checkbox
              name="autoimmune_condition"
              label={t("Autoimmune condition")}
              defaultChecked={intake?.autoimmune_condition}
            />
          </div>
          <Field label={t("Anything you'd add — which condition or joint, and how it is now")}>
            <Textarea
              name="bones_notes"
              rows={2}
              defaultValue={intake?.bones_notes ?? ""}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t("General health history")}</SectionTitle>
          <p className="text-sm text-gray">{t("Check all that apply:")}</p>
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              name="heart_condition"
              label={t("Heart condition")}
              defaultChecked={intake?.heart_condition}
            />
            <Checkbox
              name="high_blood_pressure"
              label={t("High blood pressure")}
              defaultChecked={intake?.high_blood_pressure}
            />
            <Checkbox
              name="diabetes"
              label={t("Diabetes")}
              defaultChecked={intake?.diabetes}
            />
            <Checkbox
              name="asthma"
              label={t("Asthma")}
              defaultChecked={intake?.asthma}
            />
            <Checkbox
              name="thyroid_condition"
              label={t("Thyroid condition")}
              defaultChecked={intake?.thyroid_condition}
            />
            <Checkbox
              name="joint_issues"
              label={t("Joint issues")}
              defaultChecked={intake?.joint_issues}
            />
            <Checkbox
              name="anxiety_depression"
              label={t("Anxiety / depression")}
              defaultChecked={intake?.anxiety_depression}
            />
            <Checkbox
              name="eating_disorder_history"
              label={t("Eating disorder history")}
              defaultChecked={intake?.eating_disorder_history}
            />
            <Checkbox
              name="pregnancy_postpartum"
              label={t("Pregnancy / postpartum")}
              defaultChecked={intake?.pregnancy_postpartum}
            />
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t("Medications & your doctor")}</SectionTitle>
          <Field label={t("Medications worth knowing about (blood pressure, blood thinners, etc.)")}>
            <Textarea
              name="medications"
              rows={2}
              defaultValue={intake?.medications ?? ""}
            />
          </Field>
          <Field label={t("Your doctor's name, if you'd like me to be able to reach them")}>
            <Input name="doctor_name" defaultValue={intake?.doctor_name ?? ""} />
          </Field>
          <Field label={t("Medical clearance to train")}>
            <Select
              name="medical_clearance"
              defaultValue={intake?.medical_clearance ?? ""}
            >
              <option value="">{t("— Choose one —")}</option>
              <option value="have_clearance">
                {t("I've already gotten clearance to train")}
              </option>
              <option value="in_progress">{t("I'm still working on that")}</option>
              <option value="not_needed">{t("I haven't needed to")}</option>
            </Select>
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t("Day to day")}</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Checkbox
              name="lives_alone"
              label={t("I live alone")}
              defaultChecked={intake?.lives_alone}
            />
            <Checkbox
              name="drives_self"
              label={t("I still drive myself everywhere")}
              defaultChecked={intake?.drives_self}
            />
            <Checkbox
              name="stairs_daily"
              label={t("Stairs are part of my daily life")}
              defaultChecked={intake?.stairs_daily}
            />
          </div>
          <Field label={t("Anything that feels harder these days than it used to")}>
            <Textarea
              name="day_to_day_notes"
              rows={2}
              defaultValue={intake?.day_to_day_notes ?? ""}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t("Where pain lives right now")}</SectionTitle>
          <p className="text-sm text-gray">
            {t("My goal from day one is training around pain, never through it. Pain is information for me, not something for you to push through.")}
          </p>
          <Field label={t("Where you feel pain right now, in your own words")}>
            <Textarea
              name="pain_location"
              rows={2}
              defaultValue={intake?.pain_location ?? ""}
            />
          </Field>
          <Field label={t("How long this has been going on")}>
            <Input
              name="pain_duration"
              defaultValue={intake?.pain_duration ?? ""}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("What tends to make it better")}>
              <Textarea
                name="pain_better"
                rows={2}
                defaultValue={intake?.pain_better ?? ""}
              />
            </Field>
            <Field label={t("What tends to make it worse")}>
              <Textarea
                name="pain_worse"
                rows={2}
                defaultValue={intake?.pain_worse ?? ""}
              />
            </Field>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-ink">
              {t("What kind of pain, if any")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PAIN_TYPES.map((type) => (
                <Checkbox
                  key={type}
                  name="pain_type"
                  value={type}
                  label={t(type)}
                  defaultChecked={painTypes.has(type)}
                />
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t("Right now, on a scale of 1–10")}</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Energy")}>
              <Input
                name="energy_scale"
                type="number"
                min="1"
                max="10"
                defaultValue={intake?.energy_scale ?? ""}
              />
            </Field>
            <Field label={t("Sleep quality")}>
              <Input
                name="sleep_scale"
                type="number"
                min="1"
                max="10"
                defaultValue={intake?.sleep_scale ?? ""}
              />
            </Field>
            <Field label={t("Stress")}>
              <Input
                name="stress_scale"
                type="number"
                min="1"
                max="10"
                defaultValue={intake?.stress_scale ?? ""}
              />
            </Field>
            <Field label={t("Confidence in your body")}>
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
          <SectionTitle>{t("Your goals")}</SectionTitle>
          <Field label={t("In your own words, what do you most want to change or feel differently about?")}>
            <Textarea
              name="goal_change_description"
              rows={2}
              defaultValue={intake?.goal_change_description ?? ""}
            />
          </Field>
          <Field label={t("What does success look like to you 3 months from now?")}>
            <Textarea
              name="goal_success_3_months"
              rows={2}
              defaultValue={intake?.goal_success_3_months ?? ""}
            />
          </Field>
          <Field label={t("What has held you back from reaching your goals before?")}>
            <Textarea
              name="goal_held_back_before"
              rows={2}
              defaultValue={intake?.goal_held_back_before ?? ""}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Goal importance (1 = not very important, 10 = top priority)")}>
              <Input
                name="goal_importance_scale"
                type="number"
                min="1"
                max="10"
                defaultValue={intake?.goal_importance_scale ?? ""}
              />
            </Field>
            <Field label={t("Confidence to change (1 = not confident, 10 = fully ready)")}>
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
          <SectionTitle>{t("Nutrition")}</SectionTitle>
          <Field label={t("Your relationship with food right now")}>
            <Select
              name="nutrition_relationship"
              defaultValue={intake?.nutrition_relationship ?? ""}
            >
              <option value="">{t("— Choose one —")}</option>
              <option value="comfortable">{t("Comfortable")}</option>
              <option value="complicated">{t("Complicated")}</option>
              <option value="actively_working">{t("Actively working on it")}</option>
              <option value="rather_not_say">{t("Rather not say")}</option>
            </Select>
          </Field>
          <Field label={t("Anything about food you'd want me to know")}>
            <Textarea
              name="nutrition_notes"
              rows={2}
              defaultValue={intake?.nutrition_notes ?? ""}
            />
          </Field>
          <Field label={t("Foods you love that you'd never want to give up")}>
            <Textarea
              name="foods_loved"
              rows={2}
              defaultValue={intake?.foods_loved ?? ""}
            />
          </Field>
          <Field label={t("Foods that feel scary, forbidden, or guilt-inducing")}>
            <Textarea
              name="foods_scary"
              rows={2}
              defaultValue={intake?.foods_scary ?? ""}
            />
          </Field>
          <Field label={t("Have you ever been on a structured diet or weight loss program?")}>
            <Select name="diet_history" defaultValue={intake?.diet_history ?? ""}>
              <option value="">{t("— Choose one —")}</option>
              <option value="never">{t("Never")}</option>
              <option value="once_or_twice">{t("Once or twice")}</option>
              <option value="many_times">{t("Many times")}</option>
              <option value="currently_on_one">{t("Currently on one")}</option>
            </Select>
          </Field>
          <Field label={t("How much does food stress affect your daily mood? (1 = not at all, 10 = significantly every day)")}>
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
          <SectionTitle>{t("Lifestyle")}</SectionTitle>
          <Field label={t("Who or what supports you on this journey")}>
            <Textarea
              name="support_system"
              rows={2}
              defaultValue={intake?.support_system ?? ""}
            />
          </Field>
          <Field label={t("What's the biggest competing demand on your time")}>
            <Textarea
              name="competing_demands"
              rows={2}
              defaultValue={intake?.competing_demands ?? ""}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Average sleep per night")}>
              <Input
                name="average_sleep_hours"
                defaultValue={intake?.average_sleep_hours ?? ""}
              />
            </Field>
            <Field label={t("How long have you slept this way?")}>
              <Input
                name="sleep_duration_pattern"
                defaultValue={intake?.sleep_duration_pattern ?? ""}
              />
            </Field>
          </div>
          <Field label={t("Main sources of stress in your life right now")}>
            <Textarea
              name="stress_sources"
              rows={2}
              defaultValue={intake?.stress_sources ?? ""}
            />
          </Field>
          <Field label={t("How do you typically cope with stress?")}>
            <Textarea
              name="stress_coping"
              rows={2}
              defaultValue={intake?.stress_coping ?? ""}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t("How you like to be coached")}</SectionTitle>
          <Field label={t("How do you like to be coached during a session?")}>
            <Select
              name="coaching_style"
              defaultValue={intake?.coaching_style ?? ""}
            >
              <option value="">{t("— Choose one —")}</option>
              <option value="lots_of_encouragement">
                {t("Lots of encouragement")}
              </option>
              <option value="push_me_challenge_me">
                {t("Push me / challenge me")}
              </option>
              <option value="quiet_and_focused">{t("Quiet and focused")}</option>
              <option value="flexible_read_my_mood">
                {t("Flexible — read my mood")}
              </option>
            </Select>
          </Field>
          <Field label={t("How do you prefer feedback in the moment?")}>
            <Select
              name="feedback_style"
              defaultValue={intake?.feedback_style ?? ""}
            >
              <option value="">{t("— Choose one —")}</option>
              <option value="direct_and_honest">{t("Direct and honest")}</option>
              <option value="mix_of_both">{t("Mix of both")}</option>
              <option value="gentle_and_encouraging">
                {t("Gentle and encouraging")}
              </option>
              <option value="mostly_positive_correct_big_issues">
                {t("Mostly positive, correct only big issues")}
              </option>
            </Select>
          </Field>
          <Field label={t("Best way to reach you between sessions?")}>
            <Select
              name="contact_method"
              defaultValue={intake?.contact_method ?? ""}
            >
              <option value="">{t("— Choose one —")}</option>
              <option value="text">{t("Text")}</option>
              <option value="email">{t("Email")}</option>
              <option value="call">{t("Call")}</option>
              <option value="reach_out_if_needed">
                {t("I'll reach out if needed")}
              </option>
            </Select>
          </Field>
          <Field label={t("How often would you like check-ins between sessions?")}>
            <Select
              name="checkin_frequency"
              defaultValue={intake?.checkin_frequency ?? ""}
            >
              <option value="">{t("— Choose one —")}</option>
              <option value="weekly">{t("Weekly")}</option>
              <option value="every_session_only">{t("Every session only")}</option>
              <option value="only_if_i_reach_out">{t("Only if I reach out")}</option>
              <option value="not_at_all_session_time_only">
                {t("Not at all, just session time")}
              </option>
            </Select>
          </Field>
          <Field label={t("What kind of accountability helps you most?")}>
            <Select
              name="accountability_style"
              defaultValue={intake?.accountability_style ?? ""}
            >
              <option value="">{t("— Choose one —")}</option>
              <option value="regular_checkins_from_mickey">
                {t("Regular check-ins from Mickey")}
              </option>
              <option value="tracking_own_progress">
                {t("Tracking my own progress")}
              </option>
              <option value="scheduled_sessions_enough">
                {t("Scheduled sessions are enough")}
              </option>
              <option value="friendly_reminders_nudges">
                {t("Friendly reminders / nudges")}
              </option>
            </Select>
          </Field>
          <Field label={t("Anything that has NOT worked for you with past coaches or trainers")}>
            <Textarea
              name="past_coach_what_didnt_work"
              rows={2}
              defaultValue={intake?.past_coach_what_didnt_work ?? ""}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t("Anything else?")}</SectionTitle>
          <Field label={t("Is there anything else you'd like Mickey to know?")}>
            <Textarea
              name="anything_else"
              rows={2}
              defaultValue={intake?.anything_else ?? ""}
            />
          </Field>
          <Field label={t("How did you hear about MeFirstFitness?")}>
            <Select
              name="referral_source"
              defaultValue={intake?.referral_source ?? ""}
            >
              <option value="">{t("— Choose one —")}</option>
              <option value="friend_family">{t("Friend / family referral")}</option>
              <option value="social_media">{t("Social media")}</option>
              <option value="flyer">{t("Flyer")}</option>
              <option value="google">{t("Google")}</option>
              <option value="other">{t("Other")}</option>
            </Select>
          </Field>
        </Card>

        <Button type="submit" className="w-full">
          {intake?.submitted_at ? t("Update my answers") : t("Submit")}
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
