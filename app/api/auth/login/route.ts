import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;


  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Missing Spotify environment variables" },
      { status: 500 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");

  const scope = [
    "user-library-read",
    "playlist-modify-private",
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope,
    redirect_uri: redirectUri,
    state,
  });

  const response = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );

  response.cookies.set("spotify_auth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}