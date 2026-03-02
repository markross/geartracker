import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBikes, createBike, updateBike, deleteBike } from "./bikes";
import type { Bike } from "./types";

const mockBike: Bike = {
  id: "bike-1",
  user_id: "user-1",
  name: "Road Bike",
  strava_gear_id: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

// Mock Supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}));

const mockSupabase = { from: mockFrom } as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnValue({ eq: mockEq });
  mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockDelete.mockReturnValue({ eq: mockEq });
});

describe("getBikes", () => {
  it("returns bikes for a user", async () => {
    mockEq.mockResolvedValue({ data: [mockBike], error: null });

    const result = await getBikes(mockSupabase, "user-1");

    expect(mockFrom).toHaveBeenCalledWith("bikes");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(result).toEqual({ data: [mockBike], error: null });
  });

  it("returns error on failure", async () => {
    const error = { message: "DB error", details: "", hint: "", code: "500" };
    mockEq.mockResolvedValue({ data: null, error });

    const result = await getBikes(mockSupabase, "user-1");

    expect(result).toEqual({ data: null, error });
  });
});

describe("createBike", () => {
  it("creates a bike and returns it", async () => {
    mockSingle.mockResolvedValue({ data: mockBike, error: null });

    const result = await createBike(mockSupabase, {
      user_id: "user-1",
      name: "Road Bike",
    });

    expect(mockFrom).toHaveBeenCalledWith("bikes");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      name: "Road Bike",
    });
    expect(result).toEqual({ data: mockBike, error: null });
  });
});

describe("updateBike", () => {
  it("updates a bike by id", async () => {
    mockEq.mockResolvedValue({ data: { ...mockBike, name: "Gravel Bike" }, error: null });
    mockUpdate.mockReturnValue({
      eq: mockEq,
    });

    const result = await updateBike(mockSupabase, "bike-1", { name: "Gravel Bike" });

    expect(mockFrom).toHaveBeenCalledWith("bikes");
    expect(mockUpdate).toHaveBeenCalledWith({ name: "Gravel Bike" });
    expect(mockEq).toHaveBeenCalledWith("id", "bike-1");
    expect(result.error).toBeNull();
  });
});

describe("deleteBike", () => {
  it("deletes a bike by id", async () => {
    mockEq.mockResolvedValue({ data: null, error: null });

    const result = await deleteBike(mockSupabase, "bike-1");

    expect(mockFrom).toHaveBeenCalledWith("bikes");
    expect(mockEq).toHaveBeenCalledWith("id", "bike-1");
    expect(result.error).toBeNull();
  });
});
