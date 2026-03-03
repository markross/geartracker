import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "./route";

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase-server";

const mockUser = { id: "user-1", email: "test@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
});

function mockSupabase(
  user: typeof mockUser | null,
  profileData: Record<string, unknown> = { distance_unit: "km" }
) {
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: "Not authenticated" },
      }),
    },
    from: vi.fn(() => {
      const chain: Record<string, any> = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.update = vi.fn().mockReturnValue(chain);
      chain.single = vi.fn().mockResolvedValue({
        data: profileData,
        error: null,
      });
      return chain;
    }),
  };
  vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as any);
  return supabase;
}

describe("GET /api/settings", () => {
  it("returns 401 when not authenticated", async () => {
    mockSupabase(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns user distance_unit", async () => {
    mockSupabase(mockUser, { distance_unit: "km" });
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.distance_unit).toBe("km");
  });
});

describe("PATCH /api/settings", () => {
  it("returns 401 when not authenticated", async () => {
    mockSupabase(null);
    const req = new Request("http://localhost/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ distance_unit: "mi" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid distance_unit", async () => {
    mockSupabase(mockUser);
    const req = new Request("http://localhost/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ distance_unit: "meters" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it("updates distance_unit", async () => {
    mockSupabase(mockUser, { distance_unit: "mi" });
    const req = new Request("http://localhost/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ distance_unit: "mi" }),
    });
    const res = await PATCH(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.distance_unit).toBe("mi");
  });
});
