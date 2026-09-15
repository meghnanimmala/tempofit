"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const genres = [
  "Rap",
  "Rock",
  "R&B",
  "Pop",
  "Indie",
  "EDM",
  "Country",
  "Alternative",
];

export default function PreferencesPage() {
  const router = useRouter();

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [discoveryLevel, setDiscoveryLevel] = useState(50);

  useEffect(() => {
    const savedGenres = localStorage.getItem("tempofit_genres");
    const savedDiscovery = localStorage.getItem("tempofit_discovery");

    if (savedGenres) {
      setSelectedGenres(JSON.parse(savedGenres));
    }

    if (savedDiscovery) {
      setDiscoveryLevel(Number(savedDiscovery));
    }
  }, []);

  function toggleGenre(genre: string) {
    setSelectedGenres((current) =>
      current.includes(genre)
        ? current.filter((item) => item !== genre)
        : [...current, genre]
    );
  }

  function handleContinue() {
    localStorage.setItem(
      "tempofit_genres",
      JSON.stringify(selectedGenres)
    );

    localStorage.setItem(
      "tempofit_discovery",
      discoveryLevel.toString()
    );

    router.push("/workout");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-2xl">
        <p className="mb-3 text-sm font-semibold tracking-[0.3em] text-green-400">
          TEMPOFIT
        </p>

        <h1 className="mb-2 text-4xl font-bold">
          What do you like to listen to?
        </h1>

        <p className="mb-10 text-gray-400">
          Choose the genres you want TempoFit to consider when building your
          workout playlists.
        </p>

        <div className="mb-12 flex flex-wrap gap-3">
          {genres.map((genre) => {
            const selected = selectedGenres.includes(genre);

            return (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                className={`rounded-full border px-5 py-3 transition ${
                  selected
                    ? "border-green-400 bg-green-400 text-black"
                    : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>

        <div className="mb-10">
          <div className="mb-3 flex justify-between">
            <span>Familiar</span>
            <span>Discover</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={discoveryLevel}
            onChange={(event) =>
              setDiscoveryLevel(Number(event.target.value))
            }
            className="w-full"
          />

          <p className="mt-3 text-sm text-gray-500">
            Move toward Discover if you want TempoFit to introduce more music
            outside your usual rotation.
          </p>
        </div>

        <button
          type="button"
          disabled={selectedGenres.length === 0}
          onClick={handleContinue}
          className="w-full rounded-full bg-green-500 px-8 py-4 font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </main>
  );
}