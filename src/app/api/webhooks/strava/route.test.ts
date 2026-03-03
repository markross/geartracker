import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase-admin", () => ({
  createSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/strava/webhook", () => ({
  processWebhookEvent: vi.fn(),
}));

import { GET, POST } from "./route";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { processWebhookEvent } from "@/lib/strava/webhook";
import { NextRequest } from "next/server";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("STRAVA_WEBHOOK_VERIFY_TOKEN", "test-verify-token");
  vi.stubEnv("STRAVA_CLIENT_ID", "test-client-id");
  vi.stubEnv("STRAVA_CLIENT_SECRET", "test-client-secret");
});

function makeGetRequest(params: Record<string, string>) {
  const url = new URL("http://localhost:3000/api/webhooks/strava");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

function makePostRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/webhooks/strava", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("GET /api/webhooks/strava", () => {
  it("returns challenge on valid verification", async () => {
    const req = makeGetRequest({
      "hub.mode": "subscribe",
      "hub.verify_token": "test-verify-token",
      "hub.challenge": "challenge-abc",
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ "hub.challenge": "challenge-abc" });
  });

  it("returns 403 on invalid verify token", async () => {
    const req = makeGetRequest({
      "hub.mode": "subscribe",
      "hub.verify_token": "wrong-token",
      "hub.challenge": "challenge-abc",
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns 403 when missing challenge", async () => {
    const req = makeGetRequest({
      "hub.mode": "subscribe",
      "hub.verify_token": "test-verify-token",
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/webhooks/strava", () => {
  it("processes activity.create events", async () => {
    const mockSupabase = {} as any;
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase);
    vi.mocked(processWebhookEvent).mockResolvedValue({ action: "imported", bike_created: false });

    const req = makePostRequest({
      object_type: "activity",
      object_id: 999,
      aspect_type: "create",
      owner_id: 12345,
      subscription_id: 1,
      event_time: 1700000000,
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(processWebhookEvent).toHaveBeenCalledWith(
      mockSupabase,
      expect.objectContaining({ object_id: 999 }),
      "test-client-id",
      "test-client-secret"
    );
  });

  it("always returns 200 even on error", async () => {
    vi.mocked(createSupabaseAdmin).mockReturnValue({} as any);
    vi.mocked(processWebhookEvent).mockRejectedValue(new Error("User not found"));

    const req = makePostRequest({
      object_type: "activity",
      object_id: 999,
      aspect_type: "create",
      owner_id: 99999,
      subscription_id: 1,
      event_time: 1700000000,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 200 without processing when credentials missing", async () => {
    vi.stubEnv("STRAVA_CLIENT_ID", "");
    vi.stubEnv("STRAVA_CLIENT_SECRET", "");

    const req = makePostRequest({
      object_type: "activity",
      object_id: 999,
      aspect_type: "create",
      owner_id: 12345,
      subscription_id: 1,
      event_time: 1700000000,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(processWebhookEvent).not.toHaveBeenCalled();
  });
});
