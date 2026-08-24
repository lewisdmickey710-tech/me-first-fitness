import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/back-link";
import {
  addMovementScreening,
  archiveLead,
  convertLeadToClient,
  deleteLead,
  markPacketSent,
  setLeadRequestStatus,
} from "@/app/coach/leads/actions";
import {
  Badge,
  Button,
  Card,
  Collapsible,
  EmptyState,
  Heart,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import type {
  CareProfile,
  Lead,
  LeadAssessmentRequest,
  LeadIntake,
  LeadMovementScreening,
  LeadMovementScreeningResult,
  LeadPacketRequest,
  MovementName,
} from "@/lib/types";

const MOVEMENT_GUIDE: Record<
  MovementName,
  { label: string; imbalance: string; regress: string; progress: string }
> = {
  squat: {
    label: "Squat",
    imbalance: "Knee valgus, heels rising, forward lean",
    regress: "Box Squat, Wall Sit",
    progress: "Goblet Squat, Front/Back Squat",
  },
  deadlift_hinge: {
    label: "Deadlift / Hinge",
    imbalance: "Rounded low back, hamstring tightness, quad-dominant hinge",
    regress: "Hip Hinge w/ Dowel, Cable Pull-Through",
    progress: "Single-Leg RDL, Barbell RDL",
  },
  lunge: {
    label: "Lunge",
    imbalance: "Knee caving in, trunk lean, hip drop on standing leg",
    regress: "Assisted Split Squat, Static Split Squat",
    progress: "Walking Lunge, Bulgarian Split Squat",
  },
  push_up: {
    label: "Push-Up",
    imbalance: "Hip sag, shoulder shrug, limited ROM",
    regress: "Wall Push-Up, Incline Push-Up",
    progress: "Full Push-Up w/ Tempo, Deficit/Weighted",
  },
  plank: {
    label: "Plank",
    imbalance: "Hip hike/sag, breath holding, neck strain",
    regress: "Incline Plank, Knee Plank",
    progress: "Shoulder Taps, Weighted Plank",
  },
  row: {
    label: "Row",
    imbalance: "Trunk rotation, shrugging instead of retracting",
    regress: "Band Row (seated), Inverted Row",
    progress: "Single-Arm Row, Barbell Bent-Over Row",
  },
};
const MOVEMENT_ORDER: MovementName[] = [
  "squat",
  "deadlift_hinge",
  "lunge",
  "push_up",
  "plank",
  "row",
];

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const today = new Date().toISOString().slice(0, 10);

  const supabase = await createClient();

  const { data: lead } = (await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single()) as { data: Lead | null };

  if (!lead) notFound();

  const [
    { data: intake },
    { data: requests },
    { data: screenings },
    { data: careProfiles },
    { data: packetRequests },
  ] = await Promise.all([
    supabase.from("lead_intake").select("*").eq("lead_id", id).maybeSingle() as unknown as Promise<{
      data: LeadIntake | null;
    }>,
    supabase
      .from("lead_assessment_requests")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }) as unknown as Promise<{
      data: LeadAssessmentRequest[] | null;
    }>,
    supabase
      .from("lead_movement_screenings")
      .select("*, lead_movement_screening_results(*)")
      .eq("lead_id", id)
      .order("date", { ascending: false }) as unknown as Promise<{
      data: (LeadMovementScreening & {
        lead_movement_screening_results: LeadMovementScreeningResult[];
      })[] | null;
    }>,
    supabase.from("care_profiles").select("*").order("name") as unknown as Promise<{
      data: CareProfile[] | null;
    }>,
    supabase
      .from("lead_packet_requests")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }) as unknown as Promise<{
      data: LeadPacketRequest[] | null;
    }>,
  ]);

  const careProfileNameById = new Map((careProfiles ?? []).map((cp) => [cp.id, cp.name]));

  return (
    <div className="space-y-6">
      <BackLink href="/coach/leads">← Back to leads</BackLink>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">
            <Heart className="mr-1.5" />
            {lead.name}
          </h1>
          <p className="text-sm text-gray">
            {lead.email}
            {lead.phone ? ` · ${lead.phone}` : ""}
          </p>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      {lead.note ? (
        <Card>
          <p className="text-sm font-medium text-gray">
            What they told you up front
          </p>
          <p className="mt-1 text-sm text-ink">{lead.note}</p>
        </Card>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium text-gray">
          Assessment request
        </p>
        {!requests || requests.length === 0 ? (
          <EmptyState
            title="No request yet"
            body="They haven't submitted an assessment request."
          />
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <Card key={r.id}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">
                    {r.preferred_date}
                    {r.preferred_time ? ` at ${r.preferred_time}` : ""}
                  </p>
                  <RequestStatusBadge status={r.status} />
                </div>
                {r.note ? (
                  <p className="mt-1 text-sm text-gray">{r.note}</p>
                ) : null}
                {r.status === "pending" ? (
                  <div className="mt-3 flex gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await setLeadRequestStatus(r.id, id, "confirmed");
                      }}
                    >
                      <Button type="submit">Confirm</Button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await setLeadRequestStatus(r.id, id, "declined");
                      }}
                    >
                      <Button type="submit" variant="danger">
                        Decline
                      </Button>
                    </form>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>

      {(packetRequests ?? []).length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-gray">
            Packet requests
          </p>
          <div className="space-y-2">
            {packetRequests!.map((p) => (
              <Card key={p.id}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">
                    {careProfileNameById.get(p.care_profile_id) ?? "Unknown track"}
                  </p>
                  <Badge tone={p.status === "paid_and_sent" ? "green" : "gold"}>
                    {p.status === "paid_and_sent" ? "paid & sent" : "pending"}
                  </Badge>
                </div>
                {p.note ? (
                  <p className="mt-1 text-sm text-gray">{p.note}</p>
                ) : null}
                {p.status === "pending" ? (
                  <form
                    action={async () => {
                      "use server";
                      await markPacketSent(p.id, id);
                    }}
                    className="mt-3"
                  >
                    <Button type="submit">Mark paid &amp; email packet</Button>
                  </form>
                ) : null}
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium text-gray">
          Intake questionnaire
        </p>
        {!intake?.submitted_at ? (
          <EmptyState
            title="Not submitted yet"
            body="They haven't filled out their intake questionnaire."
          />
        ) : (
          <IntakeSummary intake={intake} />
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray">
          Movement screening
        </p>
        {(screenings ?? []).map((s) => (
          <Card key={s.id} className="mb-3">
            <p className="font-medium text-ink">{s.date}</p>
            <div className="mt-2 space-y-1 text-sm">
              {MOVEMENT_ORDER.map((m) => {
                const result = s.lead_movement_screening_results.find(
                  (r) => r.movement === m
                );
                if (!result) return null;
                return (
                  <p key={m} className="text-ink">
                    <span className="font-medium">
                      {MOVEMENT_GUIDE[m].label}:
                    </span>{" "}
                    {result.score ?? "—"}/3
                    {result.pain ? " · pain" : ""}
                    {result.plan ? ` · ${result.plan}` : ""}
                    {result.notes ? ` — ${result.notes}` : ""}
                  </p>
                );
              })}
            </div>
            {s.modifications_observations ? (
              <p className="mt-2 text-sm text-gray">
                {s.modifications_observations}
              </p>
            ) : null}
            {s.coach_notes ? (
              <p className="mt-1 text-sm text-ink">{s.coach_notes}</p>
            ) : null}
          </Card>
        ))}

        <Collapsible label="+ Record a movement screening">
          <Card className="mt-2">
            <form
              action={async (formData: FormData) => {
                "use server";
                await addMovementScreening(id, formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Date
                </label>
                <Input name="date" type="date" required defaultValue={today} />
              </div>

              <p className="text-xs text-gray">
                Scoring: 3 = no compensation · 2 = minor · 1 = cannot perform
                · 0 = pain present
              </p>

              {MOVEMENT_ORDER.map((m) => {
                const guide = MOVEMENT_GUIDE[m];
                return (
                  <div key={m} className="rounded-xl border border-grayLt p-3">
                    <p className="font-medium text-ink">{guide.label}</p>
                    <p className="mt-0.5 text-xs text-gray">
                      Common imbalance: {guide.imbalance}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Select name={`${m}_score`} defaultValue="">
                        <option value="">Score</option>
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                      </Select>
                      <label className="flex items-center gap-2 rounded-xl border border-grayLt px-3 py-2 text-sm text-ink">
                        <input
                          type="checkbox"
                          name={`${m}_pain`}
                          className="h-4 w-4 rounded border-grayLt text-rose"
                        />
                        Pain
                      </label>
                      <Select name={`${m}_plan`} defaultValue="">
                        <option value="">Plan</option>
                        <option value="regress">Regress</option>
                        <option value="maintain">Maintain</option>
                        <option value="progress">Progress</option>
                      </Select>
                      <Input name={`${m}_notes`} placeholder="Notes" />
                    </div>
                    <p className="mt-2 text-xs text-gray">
                      Regress to: {guide.regress} · Progress to:{" "}
                      {guide.progress}
                    </p>
                  </div>
                );
              })}

              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Modifications / observations from today
                </label>
                <Textarea name="modifications_observations" rows={2} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Coach notes
                </label>
                <Textarea name="coach_notes" rows={3} />
              </div>

              <Button type="submit">Save screening</Button>
            </form>
          </Card>
        </Collapsible>
      </div>

      {lead.status !== "converted" ? (
        <Card>
          <p className="font-medium text-ink">Convert to client</p>
          <p className="mt-1 text-sm text-gray">
            Once you&apos;re ready to bring {lead.name.split(" ")[0]} on, set up
            their care profile and schedule here — their login carries over,
            no new account needed.
          </p>
          <form
            action={async (formData: FormData) => {
              "use server";
              await convertLeadToClient(id, formData);
            }}
            className="mt-4 space-y-3"
          >
            <Select name="care_profile_id" required defaultValue="">
              <option value="" disabled>
                — Care profile —
              </option>
              {(careProfiles ?? []).map((cp) => (
                <option key={cp.id} value={cp.id}>
                  {cp.name}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Select name="days_per_week" defaultValue="3">
                <option value="1">1 day/week</option>
                <option value="2">2 days/week</option>
                <option value="3">3 days/week</option>
                <option value="4">4 days/week</option>
                <option value="5">5 days/week</option>
                <option value="6">6 days/week</option>
              </Select>
              <Select name="session_mode" defaultValue="in_person">
                <option value="in_person">In-person</option>
                <option value="virtual">Virtual (async programming)</option>
              </Select>
            </div>
            <Input
              name="sessions_allotted"
              type="number"
              min="0"
              placeholder="Sessions allotted (optional)"
            />
            <Button type="submit">Convert to client</Button>
          </form>
        </Card>
      ) : null}

      <div className="flex gap-2">
        {lead.status === "new" ? (
          <form
            action={async () => {
              "use server";
              await archiveLead(id);
            }}
          >
            <Button type="submit" variant="ghost">
              Archive this lead
            </Button>
          </form>
        ) : null}
        <form
          action={async () => {
            "use server";
            await deleteLead(id);
          }}
        >
          <Button type="submit" variant="danger">
            Delete this lead
          </Button>
        </form>
      </div>
    </div>
  );
}

function IntakeSummary({ intake }: { intake: LeadIntake }) {
  const balanceFlags = [
    intake.fall_past_year && "fall in the past year",
    intake.near_fall && "near-fall/stumble",
    intake.fear_of_falling && "fear of falling",
  ].filter(Boolean);
  const boneFlags = [
    intake.osteoporosis && "osteoporosis/osteopenia",
    intake.joint_replacement && "joint replacement",
    intake.arthritis && "arthritis",
    intake.hypermobility && "hypermobility",
    intake.pots_dysautonomia && "POTS/dysautonomia",
    intake.mcas && "MCAS",
    intake.autoimmune_condition && "autoimmune condition",
  ].filter(Boolean);
  const dayFlags = [
    intake.lives_alone && "lives alone",
    intake.drives_self && "drives self",
    intake.stairs_daily && "stairs daily",
  ].filter(Boolean);
  const healthHistoryFlags = [
    intake.heart_condition && "heart condition",
    intake.high_blood_pressure && "high blood pressure",
    intake.diabetes && "diabetes",
    intake.thyroid_condition && "thyroid condition",
    intake.joint_issues && "joint issues",
    intake.asthma && "asthma",
    intake.anxiety_depression && "anxiety/depression",
    intake.eating_disorder_history && "eating disorder history",
    intake.pregnancy_postpartum && "pregnancy/postpartum",
  ].filter(Boolean);

  return (
    <Card className="space-y-3 text-sm">
      {intake.why_here ? (
        <SummaryRow label="Why they're here" value={intake.why_here} />
      ) : null}
      {intake.why_worthwhile ? (
        <SummaryRow
          label="What would make it worthwhile"
          value={intake.why_worthwhile}
        />
      ) : null}
      {balanceFlags.length > 0 ? (
        <SummaryRow label="Balance & falls" value={balanceFlags.join(", ")} />
      ) : null}
      {intake.balance_notes ? (
        <SummaryRow label="Balance notes" value={intake.balance_notes} />
      ) : null}
      {boneFlags.length > 0 ? (
        <SummaryRow
          label="Bones, joints & chronic conditions"
          value={boneFlags.join(", ")}
        />
      ) : null}
      {intake.bones_notes ? (
        <SummaryRow label="Bones notes" value={intake.bones_notes} />
      ) : null}
      {intake.fitness_level ? (
        <SummaryRow
          label="Fitness level"
          value={intake.fitness_level.replaceAll("_", " ")}
        />
      ) : null}
      {intake.body_satisfaction_scale != null ? (
        <SummaryRow
          label="Body satisfaction"
          value={`${intake.body_satisfaction_scale}/10`}
        />
      ) : null}
      {intake.strong_areas ? (
        <SummaryRow label="Strong areas" value={intake.strong_areas} />
      ) : null}
      {intake.injuries_limitations ? (
        <SummaryRow
          label="Injuries / limitations"
          value={intake.injuries_limitations}
        />
      ) : null}
      {healthHistoryFlags.length > 0 ? (
        <SummaryRow
          label="General health history"
          value={healthHistoryFlags.join(", ")}
        />
      ) : null}
      {intake.medications ? (
        <SummaryRow label="Medications" value={intake.medications} />
      ) : null}
      {intake.doctor_name ? (
        <SummaryRow label="Doctor" value={intake.doctor_name} />
      ) : null}
      {intake.medical_clearance ? (
        <SummaryRow
          label="Medical clearance"
          value={intake.medical_clearance.replaceAll("_", " ")}
        />
      ) : null}
      {dayFlags.length > 0 ? (
        <SummaryRow label="Day to day" value={dayFlags.join(", ")} />
      ) : null}
      {intake.day_to_day_notes ? (
        <SummaryRow label="Day to day notes" value={intake.day_to_day_notes} />
      ) : null}
      {intake.pain_location ? (
        <SummaryRow label="Pain location" value={intake.pain_location} />
      ) : null}
      {intake.pain_duration ? (
        <SummaryRow label="Pain duration" value={intake.pain_duration} />
      ) : null}
      {intake.pain_better ? (
        <SummaryRow label="What helps" value={intake.pain_better} />
      ) : null}
      {intake.pain_worse ? (
        <SummaryRow label="What worsens it" value={intake.pain_worse} />
      ) : null}
      {intake.pain_type && intake.pain_type.length > 0 ? (
        <SummaryRow label="Pain type" value={intake.pain_type.join(", ")} />
      ) : null}
      <SummaryRow
        label="Energy / Sleep / Stress / Confidence"
        value={`${intake.energy_scale ?? "—"} / ${intake.sleep_scale ?? "—"} / ${intake.stress_scale ?? "—"} / ${intake.confidence_scale ?? "—"}`}
      />
      {intake.goal_change_description ? (
        <SummaryRow
          label="What they want to change"
          value={intake.goal_change_description}
        />
      ) : null}
      {intake.goal_success_3_months ? (
        <SummaryRow
          label="Success in 3 months"
          value={intake.goal_success_3_months}
        />
      ) : null}
      {intake.goal_held_back_before ? (
        <SummaryRow
          label="What's held them back before"
          value={intake.goal_held_back_before}
        />
      ) : null}
      {intake.goal_importance_scale != null ||
      intake.confidence_to_change_scale != null ? (
        <SummaryRow
          label="Goal importance / Confidence to change"
          value={`${intake.goal_importance_scale ?? "—"} / ${intake.confidence_to_change_scale ?? "—"}`}
        />
      ) : null}
      {intake.nutrition_relationship ? (
        <SummaryRow
          label="Nutrition relationship"
          value={intake.nutrition_relationship.replaceAll("_", " ")}
        />
      ) : null}
      {intake.nutrition_notes ? (
        <SummaryRow label="Nutrition notes" value={intake.nutrition_notes} />
      ) : null}
      {intake.foods_loved ? (
        <SummaryRow label="Foods they love" value={intake.foods_loved} />
      ) : null}
      {intake.foods_scary ? (
        <SummaryRow label="Foods that feel scary" value={intake.foods_scary} />
      ) : null}
      {intake.diet_history ? (
        <SummaryRow
          label="Diet history"
          value={intake.diet_history.replaceAll("_", " ")}
        />
      ) : null}
      {intake.food_stress_scale != null ? (
        <SummaryRow
          label="Food stress impact"
          value={`${intake.food_stress_scale}/10`}
        />
      ) : null}
      {intake.support_system ? (
        <SummaryRow label="Support system" value={intake.support_system} />
      ) : null}
      {intake.competing_demands ? (
        <SummaryRow
          label="Competing demands"
          value={intake.competing_demands}
        />
      ) : null}
      {intake.average_sleep_hours || intake.sleep_duration_pattern ? (
        <SummaryRow
          label="Sleep"
          value={`${intake.average_sleep_hours ?? "—"} per night, for ${intake.sleep_duration_pattern ?? "—"}`}
        />
      ) : null}
      {intake.stress_sources ? (
        <SummaryRow label="Stress sources" value={intake.stress_sources} />
      ) : null}
      {intake.stress_coping ? (
        <SummaryRow label="How they cope" value={intake.stress_coping} />
      ) : null}
      {intake.coaching_style ? (
        <SummaryRow
          label="Coaching style preference"
          value={intake.coaching_style.replaceAll("_", " ")}
        />
      ) : null}
      {intake.feedback_style ? (
        <SummaryRow
          label="Feedback style preference"
          value={intake.feedback_style.replaceAll("_", " ")}
        />
      ) : null}
      {intake.contact_method ? (
        <SummaryRow
          label="Preferred contact method"
          value={intake.contact_method.replaceAll("_", " ")}
        />
      ) : null}
      {intake.checkin_frequency ? (
        <SummaryRow
          label="Check-in frequency"
          value={intake.checkin_frequency.replaceAll("_", " ")}
        />
      ) : null}
      {intake.accountability_style ? (
        <SummaryRow
          label="Accountability style"
          value={intake.accountability_style.replaceAll("_", " ")}
        />
      ) : null}
      {intake.past_coach_what_didnt_work ? (
        <SummaryRow
          label="What hasn't worked before"
          value={intake.past_coach_what_didnt_work}
        />
      ) : null}
      {intake.anything_else ? (
        <SummaryRow label="Anything else" value={intake.anything_else} />
      ) : null}
      {intake.referral_source ? (
        <SummaryRow
          label="How they heard about us"
          value={intake.referral_source.replaceAll("_", " ")}
        />
      ) : null}
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray/70">
        {label}
      </p>
      <p className="text-ink">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Lead["status"] }) {
  const tone =
    status === "converted" ? "green" : status === "archived" ? "gray" : "gold";
  return <Badge tone={tone}>{status}</Badge>;
}

function RequestStatusBadge({
  status,
}: {
  status: LeadAssessmentRequest["status"];
}) {
  const tone =
    status === "confirmed" ? "green" : status === "declined" ? "pink" : "gold";
  return <Badge tone={tone}>{status}</Badge>;
}
