import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { processWebhookEvent, type StravaWebhookEvent } from "@/lib/strava/webhook";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return NextResponse.json({ "hub.challenge": challenge });
  }

  return NextResponse.json({ error: "Invalid verification" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const event: StravaWebhookEvent = await request.json();

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("[webhook] Missing Strava credentials");
      return NextResponse.json({ ok: true });
    }

    const supabase = createSupabaseAdmin();
    const result = await processWebhookEvent(supabase, event, clientId, clientSecret);
    console.log("[webhook] Processed event:", event.object_type, event.aspect_type, event.object_id, "→", result.action);
  } catch (err) {
    console.error("[webhook] Error processing event:", err instanceof Error ? err.message : err);
  }

  // Always return 200 — Strava retries on non-200
  return NextResponse.json({ ok: true });
}
