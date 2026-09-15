import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("spotify_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated with Spotify" },
      { status: 401 }
    );
  }

  const spotifyResponse = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!spotifyResponse.ok) {
    return NextResponse.json(
      { error: "Failed to fetch Spotify profile" },
      { status: spotifyResponse.status }
    );
  }

  const profile = await spotifyResponse.json();

  return NextResponse.json({
    connected: true,
    displayName: profile.display_name,
    spotifyId: profile.id,
  });
}