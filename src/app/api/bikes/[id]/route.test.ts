import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT, DELETE } from "./route";

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/bikes", () => ({
  updateBike: vi.fn(),
  deleteBike: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { updateBike, deleteBike } from "@/lib/bikes";

const mockUser = { id: "user-1", email: "test@example.com" };
const mockBike = {
  id: "bike-1",
  user_id: "user-1",
  name: "Road Bike",
  strava_gear_id: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

function mockAuth(user: typeof mockUser | null) {
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: "Not authenticated" },
      }),
    },
  };
  vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as any);
  return supabase;
}

const params = { id: "bike-1" };

describe("PUT /api/bikes/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth(null);
    const req = new Request("http://localhost/api/bikes/bike-1", {
      method: "PUT",
      body: JSON.stringify({ name: "Gravel Bike" }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 400 when no fields to update", async () => {
    mockAuth(mockUser);
    const req = new Request("http://localhost/api/bikes/bike-1", {
      method: "PUT",
      body: JSON.stringify({}),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(400);
  });

  it("updates a bike and returns 200", async () => {
    mockAuth(mockUser);
    const updated = { ...mockBike, name: "Gravel Bike" };
    vi.mocked(updateBike).mockResolvedValue({ data: updated, error: null } as any);

    const req = new Request("http://localhost/api/bikes/bike-1", {
      method: "PUT",
      body: JSON.stringify({ name: "Gravel Bike" }),
    });
    const res = await PUT(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.bike).toEqual(updated);
    expect(updateBike).toHaveBeenCalledWith(expect.anything(), "bike-1", { name: "Gravel Bike" });
  });

  it("updates is_active field", async () => {
    mockAuth(mockUser);
    const updated = { ...mockBike, is_active: false };
    vi.mocked(updateBike).mockResolvedValue({ data: updated, error: null } as any);

    const req = new Request("http://localhost/api/bikes/bike-1", {
      method: "PUT",
      body: JSON.stringify({ is_active: false }),
    });
    const res = await PUT(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.bike.is_active).toBe(false);
  });

  it("returns 500 on database error", async () => {
    mockAuth(mockUser);
    vi.mocked(updateBike).mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    } as any);

    const req = new Request("http://localhost/api/bikes/bike-1", {
      method: "PUT",
      body: JSON.stringify({ name: "Gravel Bike" }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/bikes/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth(null);
    const req = new Request("http://localhost/api/bikes/bike-1", { method: "DELETE" });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(401);
  });

  it("deletes a bike and returns 204", async () => {
    mockAuth(mockUser);
    vi.mocked(deleteBike).mockResolvedValue({ error: null } as any);

    const req = new Request("http://localhost/api/bikes/bike-1", { method: "DELETE" });
    const res = await DELETE(req, { params });

    expect(res.status).toBe(204);
    expect(deleteBike).toHaveBeenCalledWith(expect.anything(), "bike-1");
  });

  it("returns 500 on database error", async () => {
    mockAuth(mockUser);
    vi.mocked(deleteBike).mockResolvedValue({
      error: { message: "DB error" },
    } as any);

    const req = new Request("http://localhost/api/bikes/bike-1", { method: "DELETE" });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(500);
  });
});
