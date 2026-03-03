import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  const ALLOWED_TYPES = ["magiclink", "recovery", "email"] as const;
  type OtpType = typeof ALLOWED_TYPES[number];

  if (!tokenHash || !type || !ALLOWED_TYPES.includes(type as OtpType)) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", request.url));
  }

  const response = NextResponse.redirect(new URL("/", request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as OtpType,
  });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=verify_failed", request.url));
  }

  return response;
}
