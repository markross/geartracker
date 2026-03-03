"use client";

import type { WearStatus } from "@/lib/types";

interface WearBarProps {
  wear_pct: number;
  status: WearStatus;
  compact?: boolean;
}

const STATUS_COLORS: Record<WearStatus, string> = {
  good: "bg-green-500",
  warning: "bg-yellow-500",
  critical: "bg-red-500",
  overdue: "bg-red-700",
};

const STATUS_LABELS: Record<WearStatus, string> = {
  good: "Good",
  warning: "Replace soon",
  critical: "Replace now",
  overdue: "Overdue",
};

export default function WearBar({ wear_pct, status, compact }: WearBarProps) {
  const width = Math.min(wear_pct, 100);

  return (
    <div className={compact ? "" : "mt-2"}>
      <div className="flex items-center justify-between text-sm">
        <span className={compact ? "text-xs text-zinc-500" : "font-medium"}>
          {wear_pct}%
        </span>
        {!compact && status !== "good" && (
          <span
            className={`text-xs font-medium ${
              status === "overdue" || status === "critical"
                ? "text-red-600"
                : "text-yellow-600"
            }`}
          >
            {STATUS_LABELS[status]}
          </span>
        )}
      </div>
      <div
        className={`overflow-hidden rounded-full bg-zinc-200 ${
          compact ? "h-1.5" : "h-2.5"
        }`}
      >
        <div
          className={`h-full rounded-full transition-all ${STATUS_COLORS[status]}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
