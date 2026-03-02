"use client";

import Link from "next/link";
import type { Bike } from "@/lib/types";

interface BikeCardProps {
  bike: Bike;
  onEdit: (bike: Bike) => void;
  onDelete: (id: string) => void;
}

export default function BikeCard({ bike, onEdit, onDelete }: BikeCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4" data-testid={`bike-card-${bike.id}`}>
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/bikes/${bike.id}/components`} className="text-lg font-semibold hover:underline">
            {bike.name}
          </Link>
          <span
            className={`text-sm ${bike.is_active ? "text-green-600" : "text-zinc-400"}`}
          >
            {bike.is_active ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(bike)}
            className="rounded bg-zinc-100 px-3 py-1 text-sm hover:bg-zinc-200"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(bike.id)}
            className="rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
