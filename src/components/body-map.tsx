"use client";

import { useState } from "react";
import type { BodyMapMarker } from "@/lib/types";

const LEVEL_FILL: Record<number, string> = {
  1: "#5EC4B6", // teal
  2: "#E8B84B", // gold
  3: "#E75480", // pink
};
const DEFAULT_FILL = "#EDEDED";

const VIEW_W = 200;
const VIEW_H = 400;

// Fixed, numbered body regions (like a standard clinical body-pain chart)
// instead of freeform tap-anywhere points. Front and back share the same
// standing-figure outline, so the same 22 shapes are reused for both views
// -- front gets ids 1-22, back gets ids 23-44 (front/back offset below).
type RegionShape = {
  key: string;
  path?: string;
  points?: string;
  labelPos: [number, number];
};

const SHAPES: RegionShape[] = [
  { key: "head_L", path: "M100,8 A24,24 0 0,0 100,56 Z", labelPos: [88, 32] },
  { key: "head_R", path: "M100,8 A24,24 0 0,1 100,56 Z", labelPos: [112, 32] },
  { key: "neck", points: "88,54 112,54 112,68 88,68", labelPos: [100, 61] },
  {
    key: "chest_L",
    points: "68,68 100,68 100,110 71.2,110",
    labelPos: [84.8, 89],
  },
  {
    key: "chest_R",
    points: "132,68 100,68 100,110 128.8,110",
    labelPos: [115.2, 89],
  },
  {
    key: "upperarm_L",
    points: "55.1,71 25.8,142.3 42.2,149.7 76.9,81",
    labelPos: [50, 111],
  },
  {
    key: "upperarm_R",
    points: "144.9,71 174.2,142.3 157.8,149.7 123.1,81",
    labelPos: [150, 111],
  },
  {
    key: "band2_L",
    points: "71.2,110 100,110 100,150 74.2,150",
    labelPos: [86.3, 130],
  },
  {
    key: "band2_R",
    points: "128.8,110 100,110 100,150 125.8,150",
    labelPos: [113.7, 130],
  },
  {
    key: "forearm_L",
    points: "26.2,144.2 14.2,204.6 25.8,207.4 41.8,147.8",
    labelPos: [27, 176],
  },
  {
    key: "forearm_R",
    points: "173.8,144.2 185.8,204.6 174.2,207.4 158.2,147.8",
    labelPos: [173, 176],
  },
  {
    key: "band3_L",
    points: "74.2,150 100,150 100,190 77.2,190",
    labelPos: [87.8, 170],
  },
  {
    key: "band3_R",
    points: "125.8,150 100,150 100,190 122.8,190",
    labelPos: [112.2, 170],
  },
  {
    key: "hand_L",
    points: "14.3,204.2 3.4,229.4 20.6,234.6 25.7,207.8",
    labelPos: [16, 219],
  },
  {
    key: "hand_R",
    points: "185.7,204.2 196.6,229.4 179.4,234.6 174.3,207.8",
    labelPos: [184, 219],
  },
  {
    key: "band4",
    points: "77.2,190 122.8,190 122,200 78,200",
    labelPos: [100, 195],
  },
  {
    key: "thigh_L",
    points: "78,200 99,200 90,290 63,290",
    labelPos: [82.5, 245],
  },
  {
    key: "thigh_R",
    points: "122,200 101,200 110,290 137,290",
    labelPos: [117.5, 245],
  },
  {
    key: "shin_L",
    points: "63,290 90,290 78,345 52,345",
    labelPos: [70.8, 317.5],
  },
  {
    key: "shin_R",
    points: "137,290 110,290 122,345 148,345",
    labelPos: [129.2, 317.5],
  },
  {
    key: "foot_L",
    points: "52,345 78,345 68,380 40,380",
    labelPos: [59.5, 362.5],
  },
  {
    key: "foot_R",
    points: "148,345 122,345 132,380 160,380",
    labelPos: [140.5, 362.5],
  },
];

const FRONT_NAMES: string[] = [
  "Head (left)",
  "Head (right)",
  "Neck",
  "Chest (left)",
  "Chest (right)",
  "Upper arm (left)",
  "Upper arm (right)",
  "Upper abdomen (left)",
  "Upper abdomen (right)",
  "Forearm (left)",
  "Forearm (right)",
  "Lower abdomen (left)",
  "Lower abdomen (right)",
  "Hand (left)",
  "Hand (right)",
  "Groin / pelvis",
  "Thigh (left)",
  "Thigh (right)",
  "Shin (left)",
  "Shin (right)",
  "Foot (left)",
  "Foot (right)",
];

const BACK_NAMES: string[] = [
  "Head, back (left)",
  "Head, back (right)",
  "Neck, back",
  "Shoulder (left)",
  "Shoulder (right)",
  "Upper arm, back (left)",
  "Upper arm, back (right)",
  "Upper back (left)",
  "Upper back (right)",
  "Forearm, back (left)",
  "Forearm, back (right)",
  "Lower back (left)",
  "Lower back (right)",
  "Hand, back (left)",
  "Hand, back (right)",
  "Tailbone / low back",
  "Thigh, back (left)",
  "Thigh, back (right)",
  "Calf (left)",
  "Calf (right)",
  "Heel (left)",
  "Heel (right)",
];

type Region = {
  id: number;
  view: "front" | "back";
  name: string;
  shape: RegionShape;
};

const REGIONS: Region[] = [
  ...SHAPES.map((shape, i) => ({
    id: i + 1,
    view: "front" as const,
    name: FRONT_NAMES[i],
    shape,
  })),
  ...SHAPES.map((shape, i) => ({
    id: i + 1 + SHAPES.length,
    view: "back" as const,
    name: BACK_NAMES[i],
    shape,
  })),
];

function regionName(id: number): string {
  return REGIONS.find((r) => r.id === id)?.name ?? `Region ${id}`;
}

export function BodyMapInput({
  name,
  defaultValue,
  readOnly = false,
}: {
  name?: string;
  defaultValue?: BodyMapMarker[] | null;
  readOnly?: boolean;
}) {
  const [markers, setMarkers] = useState<BodyMapMarker[]>(defaultValue ?? []);
  const [view, setView] = useState<"front" | "back">("front");

  const visibleRegions = REGIONS.filter((r) => r.view === view);
  const visibleMarkers = markers.filter((m) =>
    visibleRegions.some((r) => r.id === m.regionId)
  );

  function cycleRegion(regionId: number) {
    if (readOnly) return;
    setMarkers((prev) => {
      const existing = prev.find((m) => m.regionId === regionId);
      if (!existing) {
        return [...prev, { regionId, level: 1, label: "" }];
      }
      if (existing.level >= 3) {
        return prev.filter((m) => m.regionId !== regionId);
      }
      return prev.map((m) =>
        m.regionId === regionId ? { ...m, level: m.level + 1 } : m
      );
    });
  }

  function updateLabel(regionId: number, label: string) {
    setMarkers((prev) =>
      prev.map((m) => (m.regionId === regionId ? { ...m, label } : m))
    );
  }

  function removeMarker(regionId: number) {
    setMarkers((prev) => prev.filter((m) => m.regionId !== regionId));
  }

  return (
    <div className="space-y-3">
      {!readOnly ? (
        <p className="text-xs text-gray">
          Tap a numbered region to mark it — taps cycle it through{" "}
          <span className="font-medium text-teal">teal</span> →{" "}
          <span className="font-medium text-gold">gold</span> →{" "}
          <span className="font-medium text-pink">pink</span> → gone. Add a
          label below to say what it is (pain, tightness, no feeling, etc).
        </p>
      ) : null}

      <div className="flex gap-2">
        {(["front", "back"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
              view === v
                ? "bg-rose text-white"
                : "border border-grayLt bg-white text-ink hover:border-rose/40"
            }`}
          >
            {v === "front" ? "Front" : "Back"}
            {markers.some((m) =>
              REGIONS.find((r) => r.id === m.regionId)?.view === v
            )
              ? " •"
              : ""}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="mx-auto h-80 w-40 stroke-ink/70"
        strokeWidth={1}
      >
        {visibleRegions.map((r) => {
          const marker = visibleMarkers.find((m) => m.regionId === r.id);
          const fill = marker ? LEVEL_FILL[marker.level] ?? DEFAULT_FILL : DEFAULT_FILL;
          const shared = {
            key: r.id,
            fill,
            onClick: () => cycleRegion(r.id),
            className: readOnly ? "" : "cursor-pointer",
          };
          return r.shape.path ? (
            <path {...shared} d={r.shape.path} />
          ) : (
            <polygon {...shared} points={r.shape.points} />
          );
        })}
        {visibleRegions.map((r) => (
          <text
            key={`label-${r.id}`}
            x={r.shape.labelPos[0]}
            y={r.shape.labelPos[1]}
            fontSize={7}
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none fill-ink/60 stroke-none"
          >
            {r.id}
          </text>
        ))}
      </svg>

      {visibleMarkers.length > 0 ? (
        <div className="space-y-1.5">
          {visibleMarkers
            .sort((a, b) => a.regionId - b.regionId)
            .map((m) => (
              <div key={m.regionId} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: LEVEL_FILL[m.level] }}
                />
                <span className="w-36 shrink-0 text-xs text-gray">
                  #{m.regionId} {regionName(m.regionId)}
                </span>
                {readOnly ? (
                  <span className="text-sm text-ink">
                    {m.label || "(no label)"}
                  </span>
                ) : (
                  <>
                    <input
                      type="text"
                      value={m.label}
                      onChange={(e) => updateLabel(m.regionId, e.target.value)}
                      placeholder="e.g. tight, pain, no feeling"
                      className="w-full rounded-lg border border-grayLt bg-white px-2 py-1 text-sm text-ink focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose"
                    />
                    <button
                      type="button"
                      onClick={() => removeMarker(m.regionId)}
                      className="shrink-0 text-xs text-gray hover:text-pink"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            ))}
        </div>
      ) : null}

      {name ? (
        <input type="hidden" name={name} value={JSON.stringify(markers)} readOnly />
      ) : null}
    </div>
  );
}
