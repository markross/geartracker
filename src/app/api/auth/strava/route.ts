import { NextResponse } from "next/server";
import { getStravaAuthUrl } from "@/lib/strava/strava";

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Strava not configured" },
      { status: 500 }
    );
  }

  const url = getStravaAuthUrl(clientId, redirectUri);
  return NextResponse.redirect(url);
}
