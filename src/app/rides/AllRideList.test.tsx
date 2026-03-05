import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AllRideList from "./AllRideList";
import type { Ride, Bike } from "@/lib/types";

const bikes: Bike[] = [
  { id: "bike-1", user_id: "u1", name: "Road Bike", strava_gear_id: null, is_active: true, created_at: "2026-01-01T00:00:00Z" },
  { id: "bike-2", user_id: "u1", name: "MTB", strava_gear_id: null, is_active: true, created_at: "2026-01-01T00:00:00Z" },
];

const rides: Ride[] = [
  { id: "r1", user_id: "u1", bike_id: "bike-1", strava_activity_id: null, name: "Morning Ride", distance_km: 50, moving_time_seconds: 3600, started_at: "2026-03-01T08:00:00Z", created_at: "2026-03-01T08:00:00Z" },
  { id: "r2", user_id: "u1", bike_id: null, strava_activity_id: null, name: "Unassigned Ride", distance_km: 20, moving_time_seconds: 1200, started_at: "2026-03-02T08:00:00Z", created_at: "2026-03-02T08:00:00Z" },
];

const defaultProps = {
  rides,
  bikes,
  distanceUnit: "km" as const,
};

describe("AllRideList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all rides with bike names", () => {
    render(<AllRideList {...defaultProps} />);
    expect(screen.getByText("Morning Ride")).toBeInTheDocument();
    expect(screen.getByText("Unassigned Ride")).toBeInTheDocument();
  });

  it("shows current bike name for assigned rides", () => {
    render(<AllRideList {...defaultProps} />);
    const row = screen.getByTestId("ride-row-r1");
    expect(row).toHaveTextContent("Road Bike");
  });

  it("shows Unassigned label for rides without a bike", () => {
    render(<AllRideList {...defaultProps} />);
    const row = screen.getByTestId("ride-row-r2");
    expect(row).toHaveTextContent("Unassigned");
  });

  it("renders reassign dropdown for each ride", () => {
    render(<AllRideList {...defaultProps} />);
    const selects = screen.getAllByTestId("reassign-select");
    expect(selects).toHaveLength(2);
  });

  it("calls PATCH when reassigning", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = mockFetch;

    render(<AllRideList {...defaultProps} />);
    const selects = screen.getAllByTestId("reassign-select");
    fireEvent.change(selects[0], { target: { value: "bike-2" } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/rides/r1", expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ bike_id: "bike-2" }),
      }));
    });
  });

  it("updates bike display after reassign", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = mockFetch;

    render(<AllRideList {...defaultProps} />);
    const selects = screen.getAllByTestId("reassign-select");
    fireEvent.change(selects[0], { target: { value: "bike-2" } });

    await waitFor(() => {
      // The ride should now show MTB instead of Road Bike
      const row = screen.getByTestId("ride-row-r1");
      expect(row).toHaveTextContent("MTB");
    });
  });

  it("shows empty message when no rides", () => {
    render(<AllRideList {...defaultProps} rides={[]} />);
    expect(screen.getByText(/no rides/i)).toBeInTheDocument();
  });

  describe("pagination", () => {
    const PAGE_SIZE = 100;
    const manyRides: Ride[] = Array.from({ length: 150 }, (_, i) => ({
      id: `r${i}`,
      user_id: "u1",
      bike_id: "bike-1",
      strava_activity_id: null,
      name: `Ride ${i}`,
      distance_km: 10,
      moving_time_seconds: 600,
      started_at: `2026-03-01T08:00:00Z`,
      created_at: `2026-03-01T08:00:00Z`,
    }));

    it("shows only first 100 rides by default", () => {
      render(<AllRideList rides={manyRides} bikes={bikes} distanceUnit="km" />);
      const rows = screen.getAllByTestId(/^ride-row-/);
      expect(rows).toHaveLength(PAGE_SIZE);
    });

    it("shows page info", () => {
      render(<AllRideList rides={manyRides} bikes={bikes} distanceUnit="km" />);
      expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
    });

    it("navigates to next page", () => {
      render(<AllRideList rides={manyRides} bikes={bikes} distanceUnit="km" />);
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      const rows = screen.getAllByTestId(/^ride-row-/);
      expect(rows).toHaveLength(50);
      expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
    });

    it("navigates back to previous page", () => {
      render(<AllRideList rides={manyRides} bikes={bikes} distanceUnit="km" />);
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      fireEvent.click(screen.getByRole("button", { name: /prev/i }));
      expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
    });

    it("disables prev on first page", () => {
      render(<AllRideList rides={manyRides} bikes={bikes} distanceUnit="km" />);
      expect(screen.getByRole("button", { name: /prev/i })).toBeDisabled();
    });

    it("disables next on last page", () => {
      render(<AllRideList rides={manyRides} bikes={bikes} distanceUnit="km" />);
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    });

    it("hides pagination when rides fit on one page", () => {
      render(<AllRideList {...defaultProps} />);
      expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
    });
  });
});
