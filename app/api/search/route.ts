import { NextRequest, NextResponse } from "next/server";

type SpotifyTrack = {
  id: string;
  uri: string;
  name: string;
  artists?: { name: string }[];
  duration_ms: number;
  album?: {
    images?: { url: string }[];
  };
};

const genreArtists: Record<string, string[]> = {
  rap: [
    "Drake",
    "Kendrick Lamar",
    "Travis Scott",
    "Future",
    "J. Cole",
    "Tyler, The Creator",
  ],
  rock: [
    "Foo Fighters",
    "Green Day",
    "Linkin Park",
    "Arctic Monkeys",
    "Nirvana",
    "The Killers",
  ],
  pop: [
    "Dua Lipa",
    "The Weeknd",
    "Sabrina Carpenter",
    "Bruno Mars",
    "Lady Gaga",
    "Ariana Grande",
  ],
  indie: [
    "Tame Impala",
    "The Strokes",
    "Vampire Weekend",
    "Glass Animals",
    "MGMT",
    "Phoenix",
  ],
  edm: [
    "Calvin Harris",
    "Avicii",
    "Martin Garrix",
    "David Guetta",
    "Zedd",
    "Swedish House Mafia",
  ],
  "r&b": [
    "SZA",
    "Frank Ocean",
    "Brent Faiyaz",
    "Daniel Caesar",
    "Giveon",
    "Bryson Tiller",
  ],
  country: [
    "Morgan Wallen",
    "Luke Combs",
    "Zach Bryan",
    "Chris Stapleton",
    "Kacey Musgraves",
    "Thomas Rhett",
  ],
  alternative: [
    "Radiohead",
    "The 1975",
    "Twenty One Pilots",
    "Cage The Elephant",
    "Gorillaz",
    "Paramore",
  ],
};

export async function GET(request: NextRequest) {
  const accessToken =
    request.cookies.get("spotify_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated with Spotify" },
      { status: 401 }
    );
  }

  const requestedGenre =
    request.nextUrl.searchParams.get("genre") || "pop";

  const genre = requestedGenre.toLowerCase();

  const artists =
    genreArtists[genre] || genreArtists.pop;

  try {
    const responses = await Promise.all(
      artists.map(async (artist) => {
        const spotifyUrl = new URL(
          "https://api.spotify.com/v1/search"
        );

        spotifyUrl.searchParams.set(
          "q",
          `artist:"${artist}"`
        );

        spotifyUrl.searchParams.set("type", "track");
        spotifyUrl.searchParams.set("limit", "5");

        const response = await fetch(spotifyUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Spotify search failed: ${response.status}`
          );
        }

        return response.json();
      })
    );

    const allTracks: SpotifyTrack[] =
      responses.flatMap(
        (data) => data.tracks?.items || []
      );

    const uniqueTracks = Array.from(
      new Map(
        allTracks.map((track) => [track.id, track])
      ).values()
    );

    const tracks = uniqueTracks.map((track) => ({
      id: track.id,
      uri: track.uri,
      name: track.name,
      artist:
        track.artists
          ?.map((artist) => artist.name)
          .join(", ") || "Unknown Artist",
      duration_ms: track.duration_ms,
      album_image:
        track.album?.images?.[0]?.url ?? null,
    }));

    return NextResponse.json({
      genre: requestedGenre,
      count: tracks.length,
      tracks,
    });
  } catch (error) {
    console.error("Spotify search error:", error);

    return NextResponse.json(
      { error: "Spotify search failed" },
      { status: 500 }
    );
  }
}