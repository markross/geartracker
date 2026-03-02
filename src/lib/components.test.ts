import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getComponents,
  createComponent,
  updateComponent,
  deleteComponent,
  retireComponent,
} from "./components";
import type { Component } from "./types";

const mockComponent: Component = {
  id: "comp-1",
  bike_id: "bike-1",
  name: "KMC X11",
  type: "chain",
  max_distance_km: 5000,
  installed_at: "2026-01-01T00:00:00Z",
  retired_at: null,
  created_at: "2026-01-01T00:00:00Z",
};

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

describe("getComponents", () => {
  it("returns components for a bike", async () => {
    mockEq.mockResolvedValue({ data: [mockComponent], error: null });

    const result = await getComponents(mockSupabase, "bike-1");

    expect(mockFrom).toHaveBeenCalledWith("components");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEq).toHaveBeenCalledWith("bike_id", "bike-1");
    expect(result).toEqual({ data: [mockComponent], error: null });
  });
});

describe("createComponent", () => {
  it("creates a component", async () => {
    mockSingle.mockResolvedValue({ data: mockComponent, error: null });

    const result = await createComponent(mockSupabase, {
      bike_id: "bike-1",
      name: "KMC X11",
      type: "chain",
      max_distance_km: 5000,
    });

    expect(mockInsert).toHaveBeenCalledWith({
      bike_id: "bike-1",
      name: "KMC X11",
      type: "chain",
      max_distance_km: 5000,
    });
    expect(result).toEqual({ data: mockComponent, error: null });
  });
});

describe("updateComponent", () => {
  it("updates a component by id", async () => {
    mockEq.mockResolvedValue({ data: { ...mockComponent, name: "KMC X12" }, error: null });

    const result = await updateComponent(mockSupabase, "comp-1", { name: "KMC X12" });

    expect(mockUpdate).toHaveBeenCalledWith({ name: "KMC X12" });
    expect(mockEq).toHaveBeenCalledWith("id", "comp-1");
    expect(result.error).toBeNull();
  });
});

describe("retireComponent", () => {
  it("sets retired_at on a component", async () => {
    const now = "2026-03-01T00:00:00Z";
    mockEq.mockResolvedValue({
      data: { ...mockComponent, retired_at: now },
      error: null,
    });

    const result = await retireComponent(mockSupabase, "comp-1", now);

    expect(mockUpdate).toHaveBeenCalledWith({ retired_at: now });
    expect(mockEq).toHaveBeenCalledWith("id", "comp-1");
    expect(result.error).toBeNull();
  });
});

describe("deleteComponent", () => {
  it("deletes a component by id", async () => {
    mockEq.mockResolvedValue({ data: null, error: null });

    const result = await deleteComponent(mockSupabase, "comp-1");

    expect(mockEq).toHaveBeenCalledWith("id", "comp-1");
    expect(result.error).toBeNull();
  });
});
