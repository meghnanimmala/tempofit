import { NextRequest, NextResponse } from "next/server";

type SpotifyTrack = {
  id: string;
  uri: string;
  name: string;
  artists: { name: string }[];
  duration_ms: number;
  album: {
    images: { url: string }[];
  };
};

type ArtistPool = {
  familiar: string[];
  discovery: string[];
};

const genreArtists: Record<string, ArtistPool> = {
  rap: {
    familiar: [
      "Drake",
      "Kendrick Lamar",
      "Travis Scott",
      "Future",
      "J. Cole",
      "Tyler, The Creator",
    ],
    discovery: [
      "Denzel Curry",
      "Smino",
      "Isaiah Rashad",
      "Baby Keem",
      "JID",
      "Vince Staples",
    ],
  },

  rock: {
    familiar: [
      "Foo Fighters",
      "Green Day",
      "Linkin Park",
      "Arctic Monkeys",
      "Nirvana",
      "The Killers",
    ],
    discovery: [
      "Turnstile",
      "Royal Blood",
      "Nothing But Thieves",
      "Badflower",
      "Cleopatrick",
      "The Warning",
    ],
  },

  pop: {
    familiar: [
      "Dua Lipa",
      "The Weeknd",
      "Sabrina Carpenter",
      "Bruno Mars",
      "Lady Gaga",
      "Ariana Grande",
    ],
    discovery: [
      "Rina Sawayama",
      "Remi Wolf",
      "Griff",
      "Chappell Roan",
      "Magdalena Bay",
      "MUNA",
    ],
  },

  indie: {
    familiar: [
      "Tame Impala",
      "The Strokes",
      "Vampire Weekend",
      "Glass Animals",
      "MGMT",
      "Phoenix",
    ],
    discovery: [
      "Men I Trust",
      "Vacations",
      "Peach Pit",
      "Dayglow",
      "Wallows",
      "The Backseat Lovers",
    ],
  },

  edm: {
    familiar: [
      "Calvin Harris",
      "Avicii",
      "Martin Garrix",
      "David Guetta",
      "Zedd",
      "Swedish House Mafia",
    ],
    discovery: [
      "Fred again..",
      "Barry Can't Swim",
      "BUNT.",
      "Kasbo",
      "SG Lewis",
      "Overmono",
    ],
  },

  "r&b": {
    familiar: [
      "SZA",
      "Frank Ocean",
      "Brent Faiyaz",
      "Daniel Caesar",
      "Giveon",
      "Bryson Tiller",
    ],
    discovery: [
      "Ravyn Lenae",
      "Jordan Ward",
      "Fana Hues",
      "Destin Conrad",
      "Khamari",
      "UMI",
    ],
  },

  country: {
    familiar: [
      "Morgan Wallen",
      "Luke Combs",
      "Zach Bryan",
      "Chris Stapleton",
      "Kacey Musgraves",
      "Thomas Rhett",
    ],
    discovery: [
      "Wyatt Flores",
      "Sam Barber",
      "Dylan Gossett",
      "Charles Wesley Godwin",
      "49 Winchester",
      "Flatland Cavalry",
    ],
  },

  alternative: {
    familiar: [
      "Radiohead",
      "The 1975",
      "Twenty One Pilots",
      "Cage The Elephant",
      "Gorillaz",
      "Paramore",
    ],
    discovery: [
      "Fontaines D.C.",
      "Wet Leg",
      "The Last Dinner Party",
      "Royel Otis",
      "IDLES",
      "Yard Act",
    ],
  },
};

function shuffle<T>(items: T[]) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

function chooseArtists(
  pool: ArtistPool,
  discovery: number
) {
  const familiar = shuffle(pool.familiar);
  const discoveryArtists = shuffle(pool.discovery);

  // Familiar setting
  if (discovery <= 35) {
    return [
      ...familiar.slice(0, 5),
      ...discoveryArtists.slice(0, 1),
    ];
  }

  // Discovery setting
  if (discovery >= 66) {
    return [
      ...familiar.slice(0, 1),
      ...discoveryArtists.slice(0, 5),
    ];
  }

  // Balanced setting
  return [
    ...familiar.slice(0, 3),
    ...discoveryArtists.slice(0, 3),
  ];
}

export async function GET(request: NextRequest) {
  const accessToken =
    request.cookies.get("spotify_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated with Spotify" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);

  const requestedGenre =
    searchParams.get("genre")?.toLowerCase() || "pop";

  const discoveryValue = Number(
    searchParams.get("discovery") || "50"
  );

  const discovery = Math.max(
    0,
    Math.min(100, discoveryValue)
  );

  const artistPool =
    genreArtists[requestedGenre] || genreArtists.pop;

  const selectedArtists = chooseArtists(
    artistPool,
    discovery
  );

  try {
    const results = await Promise.all(
      selectedArtists.map(async (artist) => {
        const searchUrl =
          "https://api.spotify.com/v1/search?" +
          new URLSearchParams({
            q: `artist:"${artist}"`,
            type: "track",
            limit: "5",
          });

        const response = await fetch(searchUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Spotify search failed for ${artist}`
          );
        }

        const data = await response.json();

        return (data.tracks?.items || []) as SpotifyTrack[];
      })
    );

    const uniqueTracks = new Map<
      string,
      SpotifyTrack
    >();

    results.flat().forEach((track) => {
      if (
        track.id &&
        track.duration_ms >= 90000 &&
        track.duration_ms <= 420000
      ) {
        uniqueTracks.set(track.id, track);
      }
    });

    const tracks = Array.from(
      uniqueTracks.values()
    ).map((track) => ({
      id: track.id,
      uri: track.uri,
      name: track.name,
      artist:
        track.artists?.map((artist) => artist.name).join(", ") ||
        "Unknown Artist",
      duration_ms: track.duration_ms,
      album_image: track.album?.images?.[0]?.url || null,
    }));

    return NextResponse.json({
      genre: requestedGenre,
      discovery,
      selectedArtists,
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