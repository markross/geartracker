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

    // Create or get auth user using Strava athlete ID as stable key
    const email = athlete.email || `${athlete.id}@strava.athlete`;
    const metadata = {
      strava_athlete_id: athlete.id,
      full_name: `${athlete.firstname} ${athlete.lastname}`,
    };

    // Check if user already exists in our users table by strava_athlete_id
    let userId: string;
    const { data: existingProfile } = await supabase
      .from("users")
      .select("id")
      .eq("strava_athlete_id", athlete.id)
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
      // Update auth metadata
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: metadata,
      });
    } else {
      // Create new auth user
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: metadata,
        });

      if (createError || !newUser.user) {
        console.error("Auth create error", createError);
        return NextResponse.redirect(
          new URL("/login?error=auth_failed", request.url)
        );
      }
      userId = newUser.user.id;
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
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/login?error=exchange_failed", request.url)
    );
  }
}
