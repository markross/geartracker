import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/components", () => ({
  getComponents: vi.fn(),
  createComponent: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getComponents, createComponent } from "@/lib/components";

const mockUser = { id: "user-1" };
const mockComponent = {
  id: "comp-1",
  bike_id: "bike-1",
  name: "KMC X11",
  type: "chain",
  max_distance_km: 5000,
  installed_at: "2026-01-01T00:00:00Z",
  retired_at: null,
  created_at: "2026-01-01T00:00:00Z",
};

const params = { id: "bike-1" };

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

describe("GET /api/bikes/[id]/components", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth(null);
    const req = new Request("http://localhost/api/bikes/bike-1/components");
    const res = await GET(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns components for a bike", async () => {
    mockAuth(mockUser);
    vi.mocked(getComponents).mockResolvedValue({ data: [mockComponent], error: null } as any);

    const req = new Request("http://localhost/api/bikes/bike-1/components");
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.components).toEqual([mockComponent]);
    expect(getComponents).toHaveBeenCalledWith(expect.anything(), "bike-1");
  });

  it("returns 500 on database error", async () => {
    mockAuth(mockUser);
    vi.mocked(getComponents).mockResolvedValue({ data: null, error: { message: "DB error" } } as any);

    const req = new Request("http://localhost/api/bikes/bike-1/components");
    const res = await GET(req, { params });
    expect(res.status).toBe(500);
  });
});

describe("POST /api/bikes/[id]/components", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth(null);
    const req = new Request("http://localhost/api/bikes/bike-1/components", {
      method: "POST",
      body: JSON.stringify({ name: "KMC X11", type: "chain", max_distance_km: 5000 }),
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    mockAuth(mockUser);
    const req = new Request("http://localhost/api/bikes/bike-1/components", {
      method: "POST",
      body: JSON.stringify({ type: "chain", max_distance_km: 5000 }),
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid component type", async () => {
    mockAuth(mockUser);
    const req = new Request("http://localhost/api/bikes/bike-1/components", {
      method: "POST",
      body: JSON.stringify({ name: "Test", type: "invalid", max_distance_km: 5000 }),
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(400);
  });

  it("returns 400 when max_distance_km is missing or invalid", async () => {
    mockAuth(mockUser);
    const req = new Request("http://localhost/api/bikes/bike-1/components", {
      method: "POST",
      body: JSON.stringify({ name: "Test", type: "chain" }),
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(400);
  });

  it("creates a component and returns 201", async () => {
    mockAuth(mockUser);
    vi.mocked(createComponent).mockResolvedValue({ data: mockComponent, error: null } as any);

    const req = new Request("http://localhost/api/bikes/bike-1/components", {
      method: "POST",
      body: JSON.stringify({ name: "KMC X11", type: "chain", max_distance_km: 5000 }),
    });
    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.component).toEqual(mockComponent);
    expect(createComponent).toHaveBeenCalledWith(expect.anything(), {
      bike_id: "bike-1",
      name: "KMC X11",
      type: "chain",
      max_distance_km: 5000,
    });
  });
});