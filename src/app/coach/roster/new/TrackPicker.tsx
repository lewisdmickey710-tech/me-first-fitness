"use client";

import { useState } from "react";
import { Select } from "@/components/ui";
import { TRACKS } from "@/lib/constants";
import { getTrackCriterion } from "@/lib/track-criteria";

export function TrackPicker() {
  const [track, setTrack] = useState("");
  const criterion = getTrackCriterion(track);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">
        Track
      </label>
      <Select
        name="track"
        required
        value={track}
        onChange={(e) => setTrack(e.target.value)}
      >
        <option value="" disabled>
          Choose a track
        </option>
        {TRACKS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.id} — {t.name}
          </option>
        ))}
      </Select>
      {criterion ? (
        <div
          className="mt-2 rounded-xl border-l-2 bg-bg px-3 py-2 text-sm"
          style={{ borderColor: criterion.color }}
        >
          <p className="text-ink">{criterion.bestFor}</p>
          <p className="mt-1 text-xs text-gray">{criterion.signals}</p>
        </div>
      ) : null}
    </div>
  );
}
