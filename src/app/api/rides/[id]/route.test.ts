import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "./route";

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/rides", () => ({
  updateRideBike: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { updateRideBike } from "@/lib/rides";

const mockUser = { id: "user-1" };

function mockRequest(body: any) {
  return { json: () => Promise.resolve(body) } as any;
}

function mockAuthedSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /api/rides/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as any);

    const res = await PATCH(mockRequest({ bike_id: "bike-1" }), { params: { id: "ride-1" } } as any);
    expect(res.status).toBe(401);
  });

  it("returns 400 when bike_id is missing from body", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockAuthedSupabase());

    const res = await PATCH(mockRequest({}), { params: { id: "ride-1" } } as any);
    expect(res.status).toBe(400);
  });

  it("updates ride bike_id successfully", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockAuthedSupabase());
    vi.mocked(updateRideBike).mockResolvedValue({
      data: { id: "ride-1", bike_id: "bike-1" },
      error: null,
    } as any);

    const res = await PATCH(mockRequest({ bike_id: "bike-1" }), { params: { id: "ride-1" } } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.bike_id).toBe("bike-1");
  });

  it("allows setting bike_id to null", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockAuthedSupabase());
    vi.mocked(updateRideBike).mockResolvedValue({
      data: { id: "ride-1", bike_id: null },
      error: null,
    } as any);

    const res = await PATCH(mockRequest({ bike_id: null }), { params: { id: "ride-1" } } as any);
    expect(res.status).toBe(200);
    expect(updateRideBike).toHaveBeenCalledWith(expect.anything(), "ride-1", "user-1", null);
  });

  it("returns 500 on database error", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockAuthedSupabase());
    vi.mocked(updateRideBike).mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    } as any);

    const res = await PATCH(mockRequest({ bike_id: "bike-1" }), { params: { id: "ride-1" } } as any);
    expect(res.status).toBe(500);
  });
});
