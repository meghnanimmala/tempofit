"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type WorkoutProfile = {
  workout_type: string;
  focus: string;
  intensity: number;
  duration_minutes: number;
  preferred_genres: string[];
  warmup_minutes: number;
  main_minutes: number;
  cooldown_minutes: number;
};

type Track = {
  id: string;
  uri: string;
  name: string;
  artist: string;
  duration_ms: number;
  album_image: string | null;
};

type PlaylistPhase = {
  name: "warmup" | "main" | "cooldown";
  tracks: Track[];
  duration_ms: number;
  target_ms: number;
};

type PlaylistResult = {
  tracks: Track[];
  phases: PlaylistPhase[];
  total_duration_ms: number;
  target_duration_ms: number;
  difference_ms: number;
};

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function PlaylistPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<WorkoutProfile | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    async function buildPlaylist() {
      try {
        const storedProfile = localStorage.getItem(
          "tempofit_workout_profile"
        );

        if (!storedProfile) {
          setError("No workout profile found.");
          setLoading(false);
          return;
        }

        const workoutProfile: WorkoutProfile =
          JSON.parse(storedProfile);

        setProfile(workoutProfile);

        const genre =
          workoutProfile.preferred_genres[0] || "pop";

        // Step 1: Search Spotify for candidate tracks.
        let searchResponse = await fetch(
          `/api/search?genre=${encodeURIComponent(genre)}`
        );

        // If the access token expired, refresh it and retry once.
        if (searchResponse.status === 401) {
          const refreshResponse = await fetch(
            "/api/auth/refresh",
            {
              method: "POST",
            }
          );

          if (!refreshResponse.ok) {
            throw new Error(
              "Your Spotify session expired. Please reconnect Spotify."
            );
          }

          searchResponse = await fetch(
            `/api/search?genre=${encodeURIComponent(genre)}`
          );
        }

        if (!searchResponse.ok) {
          throw new Error("Spotify search failed.");
        }

        const searchData = await searchResponse.json();

        if (!searchData.tracks?.length) {
          throw new Error(
            "Spotify did not return any candidate tracks."
          );
        }

        // Step 2: Send candidates through TempoFit's playlist engine.
        const generateResponse = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tracks: searchData.tracks,
            duration: workoutProfile.duration_minutes,
            warmup_minutes: workoutProfile.warmup_minutes,
            main_minutes: workoutProfile.main_minutes,
            cooldown_minutes: workoutProfile.cooldown_minutes,
          }),
        });

        if (!generateResponse.ok) {
          throw new Error("Playlist generation failed.");
        }

        const generatedPlaylist =
          await generateResponse.json();

        setPlaylist(generatedPlaylist);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    buildPlaylist();
  }, []);

  async function saveToSpotify() {
    if (!playlist || !profile) return;

    try {
      setSaving(true);
      setSaveError("");

      const playlistData = {
        uris: playlist.tracks.map((track) => track.uri),
        workoutType: profile.workout_type,
        focus: profile.focus,
        duration: profile.duration_minutes,
        genre: profile.preferred_genres.join(", "),
      };

      async function sendPlaylist() {
        return fetch("/api/spotify/playlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(playlistData),
        });
      }

      let response = await sendPlaylist();

      // If the access token expired, refresh it and retry once.
      if (response.status === 401) {
        const refreshResponse = await fetch(
          "/api/auth/refresh",
          {
            method: "POST",
          }
        );

        if (!refreshResponse.ok) {
          throw new Error(
            "Your Spotify session expired. Please reconnect Spotify."
          );
        }

        response = await sendPlaylist();
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to save playlist to Spotify."
        );
      }

      setSavedUrl(data.playlistUrl);
    } catch (err) {
      console.error(err);

      setSaveError(
        err instanceof Error
          ? err.message
          : "Failed to save playlist."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-gray-400">
          Building your TempoFit playlist...
        </p>
      </main>
    );
  }

  if (error || !profile || !playlist) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="text-center">
          <h1 className="mb-3 text-2xl font-bold">
            Couldn&apos;t generate playlist
          </h1>

          <p className="mb-6 text-gray-400">
            {error || "Something went wrong."}
          </p>

          <button
            onClick={() => router.push("/workout")}
            className="rounded-full bg-green-500 px-6 py-3 font-semibold text-black"
          >
            Back to Workout
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-sm font-semibold tracking-[0.3em] text-green-400">
          TEMPOFIT
        </p>

        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold">
              Your Workout Playlist
            </h1>

            <p className="mt-3 text-gray-400">
              {profile.focus} · {profile.duration_minutes} min ·{" "}
              {profile.preferred_genres.join(", ")}
            </p>
          </div>

          <button
            onClick={() => router.push("/workout")}
            className="rounded-full border border-gray-700 px-5 py-2 text-sm hover:border-green-400"
          >
            Edit Workout
          </button>
        </div>

        <div className="mb-10 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
            <p className="text-xs text-gray-500">
              WARMUP
            </p>

            <p className="mt-1 font-semibold">
              {profile.warmup_minutes} min
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
            <p className="text-xs text-gray-500">
              MAIN
            </p>

            <p className="mt-1 font-semibold">
              {profile.main_minutes} min
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
            <p className="text-xs text-gray-500">
              COOLDOWN
            </p>

            <p className="mt-1 font-semibold">
              {profile.cooldown_minutes} min
            </p>
          </div>
        </div>

        <div className="space-y-10">
          {playlist.phases.map((phase) => {
            const phaseLabels = {
              warmup: "Warmup",
              main: "Main Workout",
              cooldown: "Cooldown",
            };

            return (
              <section key={phase.name}>
                <div className="mb-3 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-green-400">
                      {phase.name.toUpperCase()}
                    </p>

                    <h2 className="text-xl font-bold">
                      {phaseLabels[phase.name]}
                    </h2>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-600">
                      Phase duration
                    </p>

                    <p className="text-sm text-gray-400">
                      {formatDuration(phase.duration_ms)}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-800">
                  {phase.tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-4 border-b border-gray-800 bg-gray-950 p-4 last:border-b-0"
                    >
                      <span className="w-6 text-sm text-gray-600">
                        {index + 1}
                      </span>

                      {track.album_image && (
                        <img
                          src={track.album_image}
                          alt=""
                          className="h-12 w-12 rounded"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {track.name}
                        </p>

                        <p className="truncate text-sm text-gray-500">
                          {track.artist}
                        </p>
                      </div>

                      <p className="text-sm text-gray-500">
                        {formatDuration(track.duration_ms)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-gray-800 pt-6">
          <div>
            <p className="text-sm text-gray-500">
              Playlist duration
            </p>

            <p className="text-lg font-semibold">
              {formatDuration(
                playlist.total_duration_ms
              )}
              {" / "}
              {profile.duration_minutes}:00
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-full border border-gray-700 px-6 py-3 font-semibold hover:border-green-400"
            >
              Regenerate
            </button>

            {!savedUrl ? (
              <button
                onClick={saveToSpotify}
                disabled={saving}
                className="rounded-full bg-green-500 px-6 py-3 font-semibold text-black hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save to Spotify"}
              </button>
            ) : (
              <a
                href={savedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-green-500 px-6 py-3 font-semibold text-black hover:bg-green-400"
              >
                Open in Spotify
              </a>
            )}
          </div>
        </div>

        {saveError && (
          <p className="mt-4 text-right text-sm text-red-400">
            {saveError}
          </p>
        )}
      </div>
    </main>
  );
}