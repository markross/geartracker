import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRides, createRide, getRidesForBike } from "./rides";
import type { Ride } from "./types";

const mockRide: Ride = {
  id: "ride-1",
  user_id: "user-1",
  bike_id: "bike-1",
  strava_activity_id: 12345,
  name: "Morning Ride",
  distance_km: 42.5,
  moving_time_seconds: 5400,
  started_at: "2026-01-15T08:00:00Z",
  created_at: "2026-01-15T08:00:00Z",
};

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
}));

const mockSupabase = { from: mockFrom } as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder });
  mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) });
  mockEq.mockReturnValue({ order: mockOrder });
  mockOrder.mockReturnValue({ eq: mockEq });
});

describe("getRides", () => {
  it("returns rides for a user ordered by date", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [mockRide], error: null }),
      }),
    });

    const result = await getRides(mockSupabase, "user-1");

    expect(mockFrom).toHaveBeenCalledWith("rides");
    expect(result).toEqual({ data: [mockRide], error: null });
  });
});

describe("getRidesForBike", () => {
  it("returns rides for a specific bike", async () => {
    const mockChainedEq = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [mockRide], error: null }),
    });
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: mockChainedEq,
      }),
    });

    const result = await getRidesForBike(mockSupabase, "user-1", "bike-1");

    expect(mockFrom).toHaveBeenCalledWith("rides");
    expect(result).toEqual({ data: [mockRide], error: null });
  });
});

describe("createRide", () => {
  it("creates a ride", async () => {
    mockSingle.mockResolvedValue({ data: mockRide, error: null });

    const result = await createRide(mockSupabase, {
      user_id: "user-1",
      bike_id: "bike-1",
      strava_activity_id: 12345,
      name: "Morning Ride",
      distance_km: 42.5,
      moving_time_seconds: 5400,
      started_at: "2026-01-15T08:00:00Z",
    });

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      bike_id: "bike-1",
      strava_activity_id: 12345,
      name: "Morning Ride",
      distance_km: 42.5,
      moving_time_seconds: 5400,
      started_at: "2026-01-15T08:00:00Z",
    });
    expect(result).toEqual({ data: mockRide, error: null });
  });
});
