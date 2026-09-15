import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  const storedState = request.cookies.get("spotify_auth_state")?.value;

  // User denied Spotify authorization
  if (error) {
    return NextResponse.redirect(
      new URL("/?error=spotify_authorization_denied", request.url)
    );
  }

  // Protect against invalid OAuth requests
  if (!state || state !== storedState) {
    return NextResponse.redirect(
      new URL("/?error=state_mismatch", request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?error=missing_authorization_code", request.url)
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: "Missing Spotify environment variables" },
      { status: 500 }
    );
  }

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const tokenResponse = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    }
  );

  if (!tokenResponse.ok) {
    console.error(
      "Spotify token exchange failed:",
      tokenResponse.status
    );

    return NextResponse.redirect(
      new URL("/?error=token_exchange_failed", request.url)
    );
  }

  const tokens = await tokenResponse.json();

  const response = NextResponse.redirect(
    new URL("/preferences", process.env.SPOTIFY_REDIRECT_URI!)
  );

  response.cookies.set("spotify_access_token", tokens.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: tokens.expires_in,
    path: "/",
  });

  if (tokens.refresh_token) {
    response.cookies.set("spotify_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  response.cookies.delete("spotify_auth_state");

  return response;
}