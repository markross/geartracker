import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/bikes", () => ({
  getBikes: vi.fn(),
  createBike: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getBikes, createBike } from "@/lib/bikes";

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

describe("GET /api/bikes", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth(null);
    const req = new Request("http://localhost/api/bikes");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns bikes for authenticated user", async () => {
    mockAuth(mockUser);
    vi.mocked(getBikes).mockResolvedValue({ data: [mockBike], error: null } as any);

    const req = new Request("http://localhost/api/bikes");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.bikes).toEqual([mockBike]);
    expect(getBikes).toHaveBeenCalledWith(expect.anything(), "user-1");
  });

  it("returns 500 on database error", async () => {
    mockAuth(mockUser);
    vi.mocked(getBikes).mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    } as any);

    const req = new Request("http://localhost/api/bikes");
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

describe("POST /api/bikes", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth(null);
    const req = new Request("http://localhost/api/bikes", {
      method: "POST",
      body: JSON.stringify({ name: "Road Bike" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    mockAuth(mockUser);
    const req = new Request("http://localhost/api/bikes", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 409 when bike name already exists", async () => {
    mockAuth(mockUser);
    vi.mocked(getBikes).mockResolvedValue({ data: [mockBike], error: null } as any);

    const req = new Request("http://localhost/api/bikes", {
      method: "POST",
      body: JSON.stringify({ name: "Road Bike" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it("creates a bike and returns 201", async () => {
    mockAuth(mockUser);
    vi.mocked(getBikes).mockResolvedValue({ data: [], error: null } as any);
    vi.mocked(createBike).mockResolvedValue({ data: mockBike, error: null } as any);

    const req = new Request("http://localhost/api/bikes", {
      method: "POST",
      body: JSON.stringify({ name: "Road Bike" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.bike).toEqual(mockBike);
    expect(createBike).toHaveBeenCalledWith(expect.anything(), {
      user_id: "user-1",
      name: "Road Bike",
    });
  });
});
