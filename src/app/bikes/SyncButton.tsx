"use client";

import { useState } from "react";

export default function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Sync failed");
        return;
      }
      const data = await res.json();
      setResult(`Synced: ${data.imported} new rides (${data.skipped} already imported)`);
    } catch {
      setError("Network error during sync");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {syncing ? "Syncing..." : "Sync with Strava"}
      </button>
      {result && <p className="text-sm text-green-600">{result}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
