"use client";

import { useRef, useState } from "react";
import type { BodyMapMarker } from "@/lib/types";

const LEVEL_FILL: Record<number, string> = {
  1: "#5EC4B6", // teal
  2: "#E8B84B", // gold
  3: "#E75480", // pink
};

// Markers are stored as 0-100 percentages of the rendered box (independent
// of the SVG's own coordinate system) so saved data stays valid no matter
// how the silhouette artwork changes -- these just scale a percentage into
// actual viewBox units for drawing.
const VIEW_W = 200;
const VIEW_H = 400;

// Standing figure, arms out and legs apart (same pose used on standard
// clinical body-pain charts) so every limb is fully visible to tap on.
// Same outline for front and back -- it's a silhouette, not a detailed
// drawing, so there's nothing view-specific to draw differently.
function BodySilhouette() {
  return (
    <>
      <circle cx="100" cy="32" r="24" />
      <rect x="88" y="54" width="24" height="14" />
      <polygon points="68,68 132,68 122,200 78,200" />
      <polygon points="64,74 26,140 10,225 24,232 46,150 72,110" />
      <polygon points="136,74 174,140 190,225 176,232 154,150 128,110" />
      <polygon points="78,200 99,200 85,390 35,390" />
      <polygon points="122,200 101,200 115,390 165,390" />
    </>
  );
}

function distancePct(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
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
  const svgRef = useRef<SVGSVGElement>(null);

  const visibleMarkers = markers.filter((m) => m.view === view);

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (readOnly || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const near = visibleMarkers.find((m) => distancePct(m, { x, y }) < 5);
    if (near) {
      cycleMarker(near.id);
    } else {
      setMarkers((prev) => [
        ...prev,
        { id: crypto.randomUUID(), view, x, y, level: 1, label: "" },
      ]);
    }
  }

  function cycleMarker(id: string) {
    setMarkers((prev) =>
      prev
        .map((m) =>
          m.id === id ? { ...m, level: m.level + 1 } : m
        )
        .filter((m) => m.id !== id || m.level <= 3)
    );
  }

  function updateLabel(id: string, label: string) {
    setMarkers((prev) => prev.map((m) => (m.id === id ? { ...m, label } : m)));
  }

  function removeMarker(id: string) {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-3">
      {!readOnly ? (
        <p className="text-xs text-gray">
          Tap the diagram to drop a point — taps cycle it through{" "}
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
            {markers.some((m) => m.view === v) ? " •" : ""}
          </button>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        onClick={handleClick}
        className={`mx-auto h-80 w-40 fill-grayLt/70 ${readOnly ? "" : "cursor-crosshair"}`}
      >
        <BodySilhouette />
        {visibleMarkers.map((m) => (
          <circle
            key={m.id}
            cx={(m.x / 100) * VIEW_W}
            cy={(m.y / 100) * VIEW_H}
            r={5}
            fill={LEVEL_FILL[m.level] ?? LEVEL_FILL[1]}
            stroke="white"
            strokeWidth={1.5}
          />
        ))}
      </svg>

      {visibleMarkers.length > 0 ? (
        <div className="space-y-1.5">
          {visibleMarkers.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: LEVEL_FILL[m.level] }}
              />
              {readOnly ? (
                <span className="text-sm text-ink">
                  {m.label || "(no label)"}
                </span>
              ) : (
                <>
                  <input
                    type="text"
                    value={m.label}
                    onChange={(e) => updateLabel(m.id, e.target.value)}
                    placeholder="e.g. tight, pain, no feeling"
                    className="w-full rounded-lg border border-grayLt bg-white px-2 py-1 text-sm text-ink focus:border-rose focus:outline-none focus:ring-1 focus:ring-rose"
                  />
                  <button
                    type="button"
                    onClick={() => removeMarker(m.id)}
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
