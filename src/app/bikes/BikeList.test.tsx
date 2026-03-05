import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BikeList from "./BikeList";
import type { Bike } from "@/lib/types";

const mockBike: Bike = {
  id: "bike-1",
  user_id: "user-1",
  name: "Road Bike",
  strava_gear_id: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

const listProps = {
  bikeTotals: { "bike-1": 1200 },
  distanceUnit: "km" as const,
};

describe("BikeList", () => {
  it("renders empty state", () => {
    render(<BikeList initialBikes={[]} bikeTotals={{}} distanceUnit="km" />);
    expect(screen.getByText(/no bikes yet/i)).toBeInTheDocument();
    expect(screen.getByText("Add Bike")).toBeInTheDocument();
  });

  it("renders bikes", () => {
    render(<BikeList initialBikes={[mockBike]} {...listProps} />);
    expect(screen.getByText("Road Bike")).toBeInTheDocument();
  });

  it("shows form when Add Bike clicked", () => {
    render(<BikeList initialBikes={[]} bikeTotals={{}} distanceUnit="km" />);
    fireEvent.click(screen.getByText("Add Bike"));
    expect(screen.getByLabelText("Bike Name")).toBeInTheDocument();
  });

  it("creates a bike via API", async () => {
    const created = { ...mockBike, id: "bike-2", name: "Gravel Bike" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bike: created }),
      })
    );

    render(<BikeList initialBikes={[]} bikeTotals={{}} distanceUnit="km" />);
    fireEvent.click(screen.getByText("Add Bike"));
    fireEvent.change(screen.getByLabelText("Bike Name"), {
      target: { value: "Gravel Bike" },
    });
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(screen.getByText("Gravel Bike")).toBeInTheDocument();
    });
  });

  it("shows edit form when Edit clicked", () => {
    render(<BikeList initialBikes={[mockBike]} {...listProps} />);
    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByLabelText("Bike Name")).toHaveValue("Road Bike");
    expect(screen.getByText("Update")).toBeInTheDocument();
  });

  it("deletes a bike via API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true })
    );

    render(<BikeList initialBikes={[mockBike]} {...listProps} />);
    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(screen.queryByText("Road Bike")).not.toBeInTheDocument();
    });
  });
});
