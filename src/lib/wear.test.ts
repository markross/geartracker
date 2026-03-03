import { describe, it, expect, vi } from "vitest";
import { getWearStatus, getComponentWear, getBikeWearStats } from "./wear";
import type { Component, Bike } from "./types";

describe("getWearStatus", () => {
  it("returns good for <60%", () => {
    expect(getWearStatus(0)).toBe("good");
    expect(getWearStatus(59)).toBe("good");
  });

  it("returns warning for 60-80%", () => {
    expect(getWearStatus(60)).toBe("warning");
    expect(getWearStatus(80)).toBe("warning");
  });

  it("returns critical for 81-100%", () => {
    expect(getWearStatus(81)).toBe("critical");
    expect(getWearStatus(100)).toBe("critical");
  });

  it("returns overdue for >100%", () => {
    expect(getWearStatus(101)).toBe("overdue");
    expect(getWearStatus(200)).toBe("overdue");
  });
});

describe("getComponentWear", () => {
  const mockComponent: Component = {
    id: "comp-1",
    bike_id: "bike-1",
    name: "Chain",
    type: "chain",
    max_distance_km: 5000,
    installed_at: "2025-01-01T00:00:00Z",
    retired_at: null,
    created_at: "2025-01-01T00:00:00Z",
  };

  function createMockSupabase(rides: Array<{ distance_km: number }>) {
    const mockLte = vi.fn().mockResolvedValue({ data: rides, error: null });
    const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
    const mockEq = vi.fn().mockReturnValue({ gte: mockGte });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    return { from: mockFrom, _mocks: { mockFrom, mockSelect, mockEq, mockGte, mockLte } };
  }

  it("sums ride distances within component lifetime", async () => {
    const rides = [{ distance_km: 100 }, { distance_km: 200 }, { distance_km: 50 }];
    const supabase = createMockSupabase(rides);

    const result = await getComponentWear(supabase as any, mockComponent);

    expect(result.distance_km).toBe(350);
    expect(result.wear_pct).toBeCloseTo(7);
    expect(result.status).toBe("good");
  });

  it("returns 0 when no rides", async () => {
    const supabase = createMockSupabase([]);

    const result = await getComponentWear(supabase as any, mockComponent);

    expect(result.distance_km).toBe(0);
    expect(result.wear_pct).toBe(0);
    expect(result.status).toBe("good");
  });

  it("calculates overdue status correctly", async () => {
    const rides = [{ distance_km: 6000 }];
    const supabase = createMockSupabase(rides);

    const result = await getComponentWear(supabase as any, mockComponent);

    expect(result.wear_pct).toBe(120);
    expect(result.status).toBe("overdue");
  });

  it("queries with correct filters", async () => {
    const supabase = createMockSupabase([]);
    await getComponentWear(supabase as any, mockComponent);

    expect(supabase._mocks.mockFrom).toHaveBeenCalledWith("rides");
    expect(supabase._mocks.mockSelect).toHaveBeenCalledWith("distance_km");
    expect(supabase._mocks.mockEq).toHaveBeenCalledWith("bike_id", "bike-1");
    expect(supabase._mocks.mockGte).toHaveBeenCalledWith("started_at", "2025-01-01T00:00:00Z");
  });

  it("uses retired_at as upper bound for retired components", async () => {
    const retired = { ...mockComponent, retired_at: "2025-06-01T00:00:00Z" };
    const supabase = createMockSupabase([]);
    await getComponentWear(supabase as any, retired);

    expect(supabase._mocks.mockLte).toHaveBeenCalledWith("started_at", "2025-06-01T00:00:00Z");
  });

  it("handles max_distance_km of 0 gracefully", async () => {
    const comp = { ...mockComponent, max_distance_km: 0 };
    const rides = [{ distance_km: 100 }];
    const supabase = createMockSupabase(rides);

    const result = await getComponentWear(supabase as any, comp);

    expect(result.distance_km).toBe(100);
    expect(result.wear_pct).toBe(0);
  });
});

describe("getBikeWearStats", () => {
  it("returns wear stats for all components on a bike", async () => {
    const bike: Bike = {
      id: "bike-1",
      user_id: "user-1",
      name: "Road Bike",
      strava_gear_id: null,
      is_active: true,
      created_at: "2025-01-01T00:00:00Z",
    };

    const components: Component[] = [
      {
        id: "c1",
        bike_id: "bike-1",
        name: "Chain",
        type: "chain",
        max_distance_km: 5000,
        installed_at: "2025-01-01T00:00:00Z",
        retired_at: null,
        created_at: "2025-01-01T00:00:00Z",
      },
    ];

    const mockLte = vi.fn().mockResolvedValue({
      data: [{ distance_km: 2500 }],
      error: null,
    });
    const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
    const mockEq = vi.fn().mockReturnValue({ gte: mockGte });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    const supabase = { from: mockFrom };

    const result = await getBikeWearStats(supabase as any, bike, components);

    expect(result.bike).toBe(bike);
    expect(result.components).toHaveLength(1);
    expect(result.components[0].wear_pct).toBe(50);
    expect(result.components[0].status).toBe("good");
  });
});
