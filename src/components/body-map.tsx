"use client";

import { useRef, useState } from "react";
import type { BodyMapMarker } from "@/lib/types";

const LEVEL_FILL: Record<number, string> = {
  1: "#5EC4B6", // teal
  2: "#E8B84B", // gold
  3: "#E75480", // pink
};

// Simple humanoid silhouette, front and back -- not anatomically precise,
// just clear enough regions (head, shoulders, chest/back, arms, torso,
// hips, legs) to click a general area and drop a marker.
function BodySilhouette() {
  return (
    <>
      <circle cx="50" cy="16" r="14" />
      <rect x="38" y="30" width="24" height="8" rx="4" />
      <path d="M30 38 h40 q6 0 6 8 v46 q0 8 -6 8 h-8 v54 h-10 v-70 h-4 v70 h-10 v-54 h-8 q-6 0 -6 -8 v-46 q0 -8 6 -8 z" />
      <rect x="12" y="42" width="12" height="60" rx="6" />
      <rect x="76" y="42" width="12" height="60" rx="6" />
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
        viewBox="0 0 100 200"
        onClick={handleClick}
        className={`mx-auto h-64 w-32 fill-grayLt/70 ${readOnly ? "" : "cursor-crosshair"}`}
      >
        <BodySilhouette />
        {visibleMarkers.map((m) => (
          <circle
            key={m.id}
            cx={m.x}
            cy={m.y}
            r={2.5}
            fill={LEVEL_FILL[m.level] ?? LEVEL_FILL[1]}
            stroke="white"
            strokeWidth={0.5}
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
