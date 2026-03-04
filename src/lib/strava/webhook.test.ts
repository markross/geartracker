import { describe, it, expect, vi, beforeEach } from "vitest";
import { processWebhookEvent, type StravaWebhookEvent } from "./webhook";

vi.mock("./activities", () => ({
  fetchStravaActivity: vi.fn(),
}));

vi.mock("./token", () => ({
  getValidStravaToken: vi.fn(),
}));

vi.mock("../sync", () => ({
  processSingleActivity: vi.fn(),
}));

vi.mock("../rides", () => ({
  deleteRideByStravaId: vi.fn(),
}));

import { fetchStravaActivity } from "./activities";
import { getValidStravaToken } from "./token";
import { processSingleActivity } from "../sync";
import { deleteRideByStravaId } from "../rides";

const mockUser = {
  id: "user-1",
  email: "test@strava.athlete",
  strava_athlete_id: 12345,
  strava_access_token: "token-123",
  strava_refresh_token: "refresh-456",
  strava_token_expires_at: new Date(Date.now() + 3600000).toISOString(),
  distance_unit: "km",
  created_at: "2026-01-01T00:00:00Z",
};

function createMockSupabase(userResult: { data: any; error: any }) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(userResult),
        }),
      }),
    }),
  } as any;
}

const baseEvent: StravaWebhookEvent = {
  object_type: "activity",
  object_id: 999,
  aspect_type: "create",
  owner_id: 12345,
  subscription_id: 1,
  event_time: 1700000000,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("processWebhookEvent", () => {
  it("ignores non-activity events", async () => {
    const event = { ...baseEvent, object_type: "athlete" as const };
    const result = await processWebhookEvent({} as any, event, "cid", "csec");
    expect(result).toEqual({ action: "ignored", bike_created: false });
  });

  it("ignores update events", async () => {
    const event = { ...baseEvent, aspect_type: "update" as const };
    const result = await processWebhookEvent({} as any, event, "cid", "csec");
    expect(result).toEqual({ action: "ignored", bike_created: false });
  });

  it("deletes ride on activity.delete event", async () => {
    const mockSupabase = createMockSupabase({ data: mockUser, error: null });
    vi.mocked(deleteRideByStravaId).mockResolvedValue({ error: null } as any);

    const event = { ...baseEvent, aspect_type: "delete" as const };
    const result = await processWebhookEvent(mockSupabase, event, "cid", "csec");

    expect(result).toEqual({ action: "deleted", bike_created: false });
    expect(deleteRideByStravaId).toHaveBeenCalledWith(mockSupabase, "user-1", 999);
  });

  it("throws when delete fails", async () => {
    const mockSupabase = createMockSupabase({ data: mockUser, error: null });
    vi.mocked(deleteRideByStravaId).mockResolvedValue({ error: { message: "DB error" } } as any);

    const event = { ...baseEvent, aspect_type: "delete" as const };
    await expect(
      processWebhookEvent(mockSupabase, event, "cid", "csec")
    ).rejects.toThrow("Failed to delete ride for activity 999");
  });

  it("processes activity.create events end-to-end", async () => {
    const mockSupabase = createMockSupabase({ data: mockUser, error: null });
    const mockActivity = {
      id: 999, name: "Ride", distance: 30000, moving_time: 3600,
      start_date: "2026-03-01T08:00:00Z", gear_id: null, type: "Ride",
    };

    vi.mocked(getValidStravaToken).mockResolvedValue("valid-token");
    vi.mocked(fetchStravaActivity).mockResolvedValue(mockActivity);
    vi.mocked(processSingleActivity).mockResolvedValue({ action: "imported", bike_created: false });

    const result = await processWebhookEvent(mockSupabase, baseEvent, "cid", "csec");

    expect(result).toEqual({ action: "imported", bike_created: false });
    expect(getValidStravaToken).toHaveBeenCalledWith(mockUser, mockSupabase, "cid", "csec");
    expect(fetchStravaActivity).toHaveBeenCalledWith("valid-token", 999);
    expect(processSingleActivity).toHaveBeenCalledWith(mockSupabase, mockUser, mockActivity, "valid-token");
  });

  it("throws when user not found", async () => {
    const mockSupabase = createMockSupabase({ data: null, error: { message: "not found" } });

    await expect(
      processWebhookEvent(mockSupabase, baseEvent, "cid", "csec")
    ).rejects.toThrow("User not found for athlete 12345");
  });
});
