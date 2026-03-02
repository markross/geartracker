import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getStravaAuthUrl,
  exchangeStravaCode,
  refreshStravaToken,
} from "./strava";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("getStravaAuthUrl", () => {
  it("builds correct OAuth URL with required params", () => {
    const url = getStravaAuthUrl("client-123", "http://localhost:3000/api/auth/callback");

    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://www.strava.com");
    expect(parsed.pathname).toBe("/oauth/authorize");
    expect(parsed.searchParams.get("client_id")).toBe("client-123");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/auth/callback"
    );
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("scope")).toBe("read,activity:read_all");
  });
});

describe("exchangeStravaCode", () => {
  it("exchanges auth code for tokens", async () => {
    const mockResponse = {
      access_token: "access-123",
      refresh_token: "refresh-456",
      expires_at: 1700000000,
      athlete: {
        id: 99999,
        firstname: "Test",
        lastname: "User",
        email: "test@example.com",
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    );

    const result = await exchangeStravaCode("auth-code-xyz", "client-123", "secret-abc");

    expect(fetch).toHaveBeenCalledWith("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: "client-123",
        client_secret: "secret-abc",
        code: "auth-code-xyz",
        grant_type: "authorization_code",
      }),
    });
    expect(result.access_token).toBe("access-123");
    expect(result.refresh_token).toBe("refresh-456");
    expect(result.athlete.id).toBe(99999);
  });

  it("throws on failed exchange", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Bad Request" }), { status: 400 })
    );

    await expect(
      exchangeStravaCode("bad-code", "client-123", "secret-abc")
    ).rejects.toThrow("Strava token exchange failed");
  });
});

describe("refreshStravaToken", () => {
  it("refreshes an expired token", async () => {
    const mockResponse = {
      access_token: "new-access-789",
      refresh_token: "new-refresh-012",
      expires_at: 1700001000,
    };

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    );

    const result = await refreshStravaToken("old-refresh", "client-123", "secret-abc");

    expect(fetch).toHaveBeenCalledWith("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: "client-123",
        client_secret: "secret-abc",
        refresh_token: "old-refresh",
        grant_type: "refresh_token",
      }),
    });
    expect(result.access_token).toBe("new-access-789");
    expect(result.refresh_token).toBe("new-refresh-012");
  });

  it("throws on failed refresh", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    );

    await expect(
      refreshStravaToken("bad-refresh", "client-123", "secret-abc")
    ).rejects.toThrow("Strava token refresh failed");
  });
});
