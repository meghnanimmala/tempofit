import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const refreshToken =
    request.cookies.get("spotify_refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "No refresh token available" },
      { status: 401 }
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Spotify credentials are not configured" },
      { status: 500 }
    );
  }

  try {
    const basicAuth = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64");

    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      }
    );

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Spotify token refresh failed:", tokens);

      const response = NextResponse.json(
        { error: "Spotify session expired" },
        { status: 401 }
      );

      // If the refresh token itself is no longer valid,
      // require the user to authenticate again.
      if (tokens.error === "invalid_grant") {
        response.cookies.delete("spotify_access_token");
        response.cookies.delete("spotify_refresh_token");
      }

      return response;
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set(
      "spotify_access_token",
      tokens.access_token,
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: tokens.expires_in,
        path: "/",
      }
    );

    // Spotify may issue a replacement refresh token.
    if (tokens.refresh_token) {
      response.cookies.set(
        "spotify_refresh_token",
        tokens.refresh_token,
        {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 180,
          path: "/",
        }
      );
    }

    return response;
  } catch (error) {
    console.error("Spotify refresh error:", error);

    return NextResponse.json(
      { error: "Failed to refresh Spotify session" },
      { status: 500 }
    );
  }
}