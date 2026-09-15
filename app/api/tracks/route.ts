import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("spotify_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated with Spotify" },
      { status: 401 }
    );
  }

  const spotifyResponse = await fetch(
    "https://api.spotify.com/v1/me/tracks?limit=50",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!spotifyResponse.ok) {
    return NextResponse.json(
      {
        error: "Failed to fetch saved Spotify tracks",
        status: spotifyResponse.status,
      },
      { status: spotifyResponse.status }
    );
  }

  const data = await spotifyResponse.json();

  const tracks = data.items
    .map((item: any) => item.track)
    .filter(Boolean)
    .map((track: any) => ({
      id: track.id,
      uri: track.uri,
      name: track.name,
      artist: track.artists
        ?.map((artist: any) => artist.name)
        .join(", "),
      duration_ms: track.duration_ms,
    }));

  return NextResponse.json({
    count: tracks.length,
    tracks,
  });
}