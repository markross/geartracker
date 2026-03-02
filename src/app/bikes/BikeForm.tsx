"use client";

import { useState } from "react";
import type { Bike } from "@/lib/types";

interface BikeFormProps {
  bike?: Bike | null;
  onSubmit: (data: { name: string }) => void;
  onCancel: () => void;
}

export default function BikeForm({ bike, onSubmit, onCancel }: BikeFormProps) {
  const [name, setName] = useState(bike?.name ?? "");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    setError("");
    onSubmit({ name: trimmed });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="bike-name" className="block text-sm font-medium">
          Bike Name
        </label>
        <input
          id="bike-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          placeholder="e.g. Road Bike"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {bike ? "Update" : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded bg-zinc-100 px-4 py-2 hover:bg-zinc-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
