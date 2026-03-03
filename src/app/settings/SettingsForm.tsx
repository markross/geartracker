"use client";

import { useState } from "react";
import type { DistanceUnit } from "@/lib/types";

interface SettingsFormProps {
  initialUnit: DistanceUnit;
}

export default function SettingsForm({ initialUnit }: SettingsFormProps) {
  const [unit, setUnit] = useState<DistanceUnit>(initialUnit);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distance_unit: unit }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to save");
      }
      setMessage({ type: "success", text: "Settings saved" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-zinc-700">Distance Unit</legend>
        <div className="flex gap-4">
          {(["km", "mi"] as const).map((value) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="distance_unit"
                value={value}
                checked={unit === value}
                onChange={() => setUnit(value)}
                className="accent-blue-600"
              />
              <span className="text-sm">
                {value === "km" ? "Kilometers (km)" : "Miles (mi)"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || unit === initialUnit}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {message && (
          <span
            className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}
          >
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
