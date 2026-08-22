"use client";

import { useState } from "react";
import { Select } from "@/components/ui";
import type { CareProfile } from "@/lib/types";

export function CareProfilePicker({
  careProfiles,
  defaultValue,
  required = true,
}: {
  careProfiles: CareProfile[];
  defaultValue?: string;
  required?: boolean;
}) {
  const [selected, setSelected] = useState(defaultValue ?? "");
  const profile = careProfiles.find((p) => p.id === selected);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">
        Care profile
      </label>
      <Select
        name="care_profile_id"
        required={required}
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="" disabled>
          Choose a care profile
        </option>
        {careProfiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
      {profile?.description ? (
        <p className="mt-2 rounded-xl border-l-2 border-rose bg-bg px-3 py-2 text-sm text-ink">
          {profile.description}
        </p>
      ) : null}
    </div>
  );
}
