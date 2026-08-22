export const SORTING_QUESTIONS = [
  "How many days a week can they realistically commit to, right now — not what they hope to work up to?",
  "Is there a medical condition that needs ongoing extra care — chronic illness, bone density, surgical history, an active injury?",
  "Do they fall into a special population category — postpartum, primarily balance/fall-risk focused, or needing every session supervised?",
  "Can they train solo between coached sessions, or does safety/complexity mean every session needs to be coached?",
  "In-person or virtual?",
] as const;

export interface TrackCriterion {
  id: string;
  structure: string;
  bestFor: string;
  signals: string;
  color: string;
}

/**
 * "Best for" / "signals" text is transcribed from the Track Criteria
 * Reference source. A few phrases were cut off by PDF page-width
 * truncation at the source; those were completed with the single obvious
 * word the sentence requires (e.g. "a cla_" -> "a class") rather than left
 * broken. Low-risk, unlike exercise content — flagged to the coach to spot
 * check, not exercise prescriptions.
 */
export const TRACK_CRITERIA: TrackCriterion[] = [
  {
    id: "A",
    structure: "1 coached + 2 solo — Legs / Push / Pull",
    bestFor:
      "Clients who can commit to 3 structured days a week and want a traditional split.",
    signals:
      "Available 3x/week · no major medical complexity · comfortable with a classic split",
    color: "#4A9A9A",
  },
  {
    id: "A.2",
    structure: "1 coached + 2 solo, plus a flexible 4th day",
    bestFor:
      "Clients who prefer full-body sessions over a split, and want a built-in flexible day.",
    signals:
      "Available 3–4x/week · prefers full-body over splits · wants a class/activity option built in",
    color: "#E75480",
  },
  {
    id: "B",
    structure: "1 coached + 1 solo, class is bonus",
    bestFor:
      "Clients with only 2 structured days available who already attend, or want to add, a class.",
    signals:
      "Available 2x/week structured · no major medical complexity · class access available",
    color: "#5D8A5E",
  },
  {
    id: "C",
    structure: "Only 1 true resistance day/week",
    bestFor: "Clients whose realistic availability is a single weekly session.",
    signals: "Available 1x/week only · needs a maximally efficient full-body session",
    color: "#C9A96E",
  },
  {
    id: "C.2",
    structure: "Same session x3, then a combination week",
    bestFor:
      "Clients relearning their body — returning from a long break or rebuilding fundamental movement patterns and mind-muscle connection.",
    signals:
      "Returning after a long gap · needs repetition before variety · confidence-building",
    color: "#4A9A9A",
  },
  {
    id: "C.3",
    structure: "Standard progression, extra-care pacing built in",
    bestFor:
      "Clients with a chronic illness who can still commit to 3x/week but need built-in extra-care pacing.",
    signals:
      "Chronic illness present (EDS, POTS, MCAS, autoimmune, etc.) · available 3x/week",
    color: "#E75480",
  },
  {
    id: "D",
    structure: "2x/week short sessions, mobility/pain-led",
    bestFor:
      "Clients with an active injury or in a rehab phase, not yet ready for full strength work.",
    signals:
      "Active injury or post-rehab · pain is a present factor · short sessions realistic",
    color: "#5D8A5E",
  },
  {
    id: "E",
    structure: "Like Track C, plus a real bodyweight home day",
    bestFor:
      "Clients like Track C who also have the space and motivation for a home session.",
    signals:
      "Available 1x/week in-person · willing and able to train at home unsupervised",
    color: "#C9A96E",
  },
  {
    id: "F",
    structure: "Stays stability-forward regardless of phase label",
    bestFor:
      "Clients whose medical profile requires staying conservative long-term — phase labels don't apply the normal way.",
    signals:
      "Bone density concerns · multiple compounding conditions · surgical hardware",
    color: "#B9829A",
  },
  {
    id: "G",
    structure: "No in-person sessions assumed",
    bestFor: "Clients training remotely without access to a full gym.",
    signals: "No in-person sessions · home or minimal equipment only",
    color: "#4A9A9A",
  },
  {
    id: "H",
    structure: "No solo days assumed",
    bestFor:
      "Clients who need every session supervised, often due to complexity or safety.",
    signals: "Needs supervision every session · high medical complexity or high support need",
    color: "#E75480",
  },
  {
    id: "I",
    structure: "Balance and functional independence led",
    bestFor:
      "Clients whose primary goal is functional independence and fall-risk reduction, regardless of chronological age.",
    signals:
      "Balance/fall risk is the primary concern · functional daily-life movement is the goal",
    color: "#5D8A5E",
  },
  {
    id: "J",
    structure: "Pelvic-floor-informed progression",
    bestFor:
      "Clients who are postpartum and need pelvic floor and core reconnection before general programming.",
    signals: "Postpartum · needs pelvic floor/core clearance built into early programming",
    color: "#C9A96E",
  },
];

export function getTrackCriterion(id: string): TrackCriterion | undefined {
  return TRACK_CRITERIA.find((t) => t.id === id);
}
