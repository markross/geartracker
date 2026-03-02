import { NextRequest, NextResponse } from "next/server";
import { exchangeStravaCode } from "@/lib/strava/strava";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  const clientId = process.env.STRAVA_CLIENT_ID!;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET!;

  try {
    // Exchange code for tokens
    const tokenData = await exchangeStravaCode(code, clientId, clientSecret);
    const { access_token, refresh_token, expires_at, athlete } = tokenData;

    const supabase = createSupabaseAdmin();

    // Create or get auth user using Strava athlete ID as identifier
    const email = athlete.email || `${athlete.id}@strava.athlete`;
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          strava_athlete_id: athlete.id,
          full_name: `${athlete.firstname} ${athlete.lastname}`,
        },
      });

    // If user already exists, look them up
    let userId: string;
    if (authError?.message?.includes("already been registered")) {
      const { data: existingUsers } =
        await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(
        (u) => u.email === email
      );
      if (!existing) {
        return NextResponse.redirect(
          new URL("/login?error=user_lookup_failed", request.url)
        );
      }
      userId = existing.id;
    } else if (authError) {
      return NextResponse.redirect(
        new URL("/login?error=auth_failed", request.url)
      );
    } else {
      userId = authData.user.id;
    }

    // Upsert user profile with Strava tokens
    const { error: profileError } = await supabase.from("users").upsert(
      {
        id: userId,
        email,
        strava_athlete_id: athlete.id,
        strava_access_token: access_token,
        strava_refresh_token: refresh_token,
        strava_token_expires_at: new Date(expires_at * 1000).toISOString(),
      },
      { onConflict: "id" }
    );

    if (profileError) {
      return NextResponse.redirect(
        new URL("/login?error=profile_failed", request.url)
      );
    }

    // Generate a session for the user
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (sessionError || !sessionData) {
      return NextResponse.redirect(
        new URL("/login?error=session_failed", request.url)
      );
    }

    // Redirect through the Supabase auth confirm endpoint to set session cookies
    const confirmUrl = new URL("/api/auth/confirm", request.url);
    const token_hash = sessionData.properties?.hashed_token;
    if (token_hash) {
      confirmUrl.searchParams.set("token_hash", token_hash);
      confirmUrl.searchParams.set("type", "magiclink");
      return NextResponse.redirect(confirmUrl);
    }

    // Fallback: redirect to home
    return NextResponse.redirect(new URL("/", request.url));
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=exchange_failed", request.url)
    );
  }
}
