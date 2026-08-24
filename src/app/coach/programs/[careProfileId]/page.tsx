import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { saveProgramDay, uploadCareProfilePacket } from "@/app/coach/programs/actions";
import { Button, Card, Collapsible, Heart, Input, Select } from "@/components/ui";
import { PHASES } from "@/lib/constants";
import type {
  CareProfile,
  CareProfilePacket,
  CareProfilePhaseNotes,
  Exercise,
  ProgramDayExercise,
} from "@/lib/types";

const ROWS = 10;

function PhaseNotesCard({ notes }: { notes: CareProfilePhaseNotes }) {
  return (
    <Card className="border-rose/30 bg-rose/5">
      {notes.headline ? (
        <p className="font-medium text-ink">
          <Heart className="mr-1.5" />
          {notes.headline}
        </p>
      ) : null}

      <div className="mt-3 space-y-2">
        {notes.coach_tips ? (
          <Collapsible label="Coach tips">
            <p className="whitespace-pre-wrap text-sm text-ink">
              {notes.coach_tips}
            </p>
          </Collapsible>
        ) : null}

        {notes.extra_care ? (
          <Collapsible label="Extra care & red flags">
            <p className="whitespace-pre-wrap text-sm text-ink">
              {notes.extra_care}
            </p>
          </Collapsible>
        ) : null}

        {notes.cardio_guidance ? (
          <Collapsible label="Cardio guidance">
            <p className="whitespace-pre-wrap text-sm text-ink">
              {notes.cardio_guidance}
            </p>
          </Collapsible>
        ) : null}
      </div>
    </Card>
  );
}

interface ProgramDayWithExercises {
  id: string;
  day_number: number;
  day_label: string;
  program_day_exercises: ProgramDayExercise[];
}

export default async function CareProfileProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ careProfileId: string }>;
  searchParams: Promise<{ phase?: string }>;
}) {
  const { careProfileId } = await params;
  const { phase: phaseParam } = await searchParams;
  const phase = ["1", "2", "3", "4"].includes(phaseParam ?? "")
    ? phaseParam!
    : "1";

  const supabase = await createClient();

  const [
    { data: careProfile },
    { data: exercises },
    { data: days },
    { data: phaseNotes },
    { data: packets },
  ] = await Promise.all([
    supabase
      .from("care_profiles")
      .select("*")
      .eq("id", careProfileId)
      .single() as unknown as Promise<{ data: CareProfile | null }>,
    supabase.from("exercises").select("*").order("name") as unknown as Promise<{
      data: Exercise[] | null;
    }>,
    supabase
      .from("program_days")
      .select("*, program_day_exercises(*)")
      .eq("care_profile_id", careProfileId)
      .eq("phase", phase)
      .order("day_number") as unknown as Promise<{
      data: ProgramDayWithExercises[] | null;
    }>,
    supabase
      .from("care_profile_phase_notes")
      .select("*")
      .eq("care_profile_id", careProfileId)
      .eq("phase", phase)
      .maybeSingle() as unknown as Promise<{ data: CareProfilePhaseNotes | null }>,
    supabase
      .from("care_profile_packets")
      .select("*")
      .eq("care_profile_id", careProfileId) as unknown as Promise<{
      data: CareProfilePacket[] | null;
    }>,
  ]);

  if (!careProfile) notFound();

  const exerciseList = exercises ?? [];
  const daysByNumber = new Map((days ?? []).map((d) => [d.day_number, d]));
  const packetByPhase = new Map((packets ?? []).map((p) => [p.phase, p]));
  const uploadedPhaseCount = packetByPhase.size;
  const currentPhasePacket = packetByPhase.get(phase as CareProfilePacket["phase"]);

  return (
    <div className="space-y-6">
      <BackLink href="/coach/programs">← Back to program templates</BackLink>

      <h1 className="text-xl font-semibold text-ink">
        <Heart className="mr-1.5" />
        {careProfile.name}
      </h1>

      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-medium text-ink">Packet PDFs</p>
          <span className="text-sm text-gray">{uploadedPhaseCount} of 4 uploaded</span>
        </div>
        <p className="text-sm text-gray">
          The $50 packet purchase covers all 4 phases — upload one PDF per
          phase. You won&apos;t be able to confirm a lead&apos;s packet
          request by email until all 4 are here.
        </p>
        <div className="border-t border-grayLt pt-3">
          <p className="text-sm font-medium text-ink">
            Phase {phase}{" "}
            {currentPhasePacket ? (
              <span className="font-normal text-gray">— uploaded</span>
            ) : (
              <span className="font-normal text-gray">— nothing uploaded</span>
            )}
          </p>
          <form
            action={async (formData: FormData) => {
              "use server";
              await uploadCareProfilePacket(careProfileId, phase, formData);
            }}
            className="mt-2 flex items-center gap-2"
          >
            <input
              type="file"
              name="packet"
              accept="application/pdf"
              required
              className="text-sm text-ink"
            />
            <Button type="submit" variant="secondary">
              {currentPhasePacket ? "Replace" : "Upload"}
            </Button>
          </form>
          <p className="mt-1 text-xs text-gray">
            Switch phase tabs below to upload the other phases.
          </p>
        </div>
      </Card>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm">
        {PHASES.filter((p) => p.id !== "n/a").map((p) => (
          <Link
            key={p.id}
            href={`/coach/programs/${careProfileId}?phase=${p.id}`}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              phase === p.id
                ? "bg-rose text-white"
                : "text-gray hover:text-ink"
            }`}
          >
            {p.name}
          </Link>
        ))}
      </div>

      {phaseNotes ? <PhaseNotesCard notes={phaseNotes} /> : null}

      <div className="space-y-6">
        {[1, 2, 3].map((dayNumber) => {
          const day = daysByNumber.get(dayNumber);
          const existingRows = (day?.program_day_exercises ?? [])
            .slice()
            .sort((a, b) => a.position - b.position);
          const rows = Array.from({ length: ROWS }, (_, i) => existingRows[i]);
          const boundSave = saveProgramDay.bind(
            null,
            careProfileId,
            phase,
            dayNumber
          );

          return (
            <Card key={dayNumber}>
              <form action={boundSave} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Day {dayNumber} label
                  </label>
                  <Input
                    name="day_label"
                    required
                    defaultValue={day?.day_label ?? ""}
                    placeholder="e.g. Legs & Glutes"
                  />
                </div>

                <div className="space-y-2">
                  {rows.map((row, i) => (
                    <div
                      key={i}
                      className="space-y-1.5 rounded-xl border border-grayLt p-2"
                    >
                      <Select
                        name="exercise_id"
                        defaultValue={row?.exercise_id ?? ""}
                      >
                        <option value="">— Exercise —</option>
                        {exerciseList.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.name}
                          </option>
                        ))}
                      </Select>
                      <div className="grid grid-cols-12 gap-2">
                        <Input
                          name="sets"
                          placeholder="Sets"
                          className="col-span-3"
                          defaultValue={row?.sets ?? ""}
                        />
                        <Input
                          name="reps"
                          placeholder="Reps"
                          className="col-span-3"
                          defaultValue={row?.reps ?? ""}
                        />
                        <Input
                          name="tempo"
                          placeholder="Tempo"
                          className="col-span-3"
                          defaultValue={row?.tempo ?? ""}
                          title="e.g. 3-1-1-0 (eccentric-pause-concentric-pause)"
                        />
                        <Input
                          name="superset_group"
                          placeholder="A/B"
                          className="col-span-3"
                          defaultValue={row?.superset_group ?? ""}
                          title="For phases 2 & 4: mark paired exercises the same number with A/B, e.g. 1A and 1B"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray">
                  Tempo is optional (e.g. &quot;3-1-1-0&quot;). For superset
                  phases (2 &amp; 4), give paired rows the same A/B tag — e.g.
                  &quot;1A&quot; and &quot;1B&quot; — so they read as a pair.
                  Leave a row blank to skip it.
                </p>

                <Button type="submit">Save Day {dayNumber}</Button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
