"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseWorkout } from "@/lib/workoutParser";

export default function WorkoutPage() {
  const router = useRouter();

  const [workout, setWorkout] = useState("");
  const [duration, setDuration] = useState(45);

  function decreaseDuration() {
    setDuration((current) => Math.max(15, current - 5));
  }

  function increaseDuration() {
    setDuration((current) => Math.min(120, current + 5));
  }

  function handleGenerate() {
    const savedGenres = JSON.parse(
    localStorage.getItem("tempofit_genres") || "[]"
  );

  const workoutProfile = parseWorkout(
    workout,
    duration,
    savedGenres
  );

  localStorage.setItem("tempofit_workout", workout);

  localStorage.setItem(
    "tempofit_duration",
    duration.toString()
  );

  localStorage.setItem(
    "tempofit_workout_profile",
    JSON.stringify(workoutProfile)
  );

  console.log("TempoFit WorkoutProfile:", workoutProfile);

  router.push("/playlist");
}

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-2xl">
        <p className="mb-3 text-sm font-semibold tracking-[0.3em] text-green-400">
          TEMPOFIT
        </p>

        <h1 className="mb-2 text-4xl font-bold">
          What&apos;s today&apos;s workout?
        </h1>

        <p className="mb-8 text-gray-400">
          Describe your workout naturally. TempoFit will use it to shape your
          playlist.
        </p>

        <textarea
          value={workout}
          onChange={(event) => setWorkout(event.target.value)}
          placeholder="Heavy leg day with squats and RDLs. I want something hype, mostly rap."
          rows={6}
          className="mb-8 w-full resize-none rounded-2xl border border-gray-700 bg-gray-900 p-5 text-white outline-none transition placeholder:text-gray-600 focus:border-green-400"
        />

        <div className="mb-8">
          <p className="mb-4 font-semibold">Workout duration</p>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={decreaseDuration}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-700 text-xl hover:border-green-400"
            >
              −
            </button>

            <div className="min-w-24 text-center">
              <span className="text-3xl font-bold">{duration}</span>
              <span className="ml-2 text-gray-400">min</span>
            </div>

            <button
              type="button"
              onClick={increaseDuration}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-700 text-xl hover:border-green-400"
            >
              +
            </button>
          </div>
        </div>

        <div className="mb-10 rounded-2xl border border-gray-800 bg-gray-950 p-5">
          <p className="mb-2 text-sm font-semibold text-gray-300">
            Try something like:
          </p>

          <p className="text-sm text-gray-500">
            &quot;30-minute easy run, mostly indie&quot;
          </p>

          <p className="text-sm text-gray-500">
            &quot;High-intensity upper body day with EDM&quot;
          </p>

          <p className="text-sm text-gray-500">
            &quot;Heavy leg day, hype rap&quot;
          </p>
        </div>

        <button
          type="button"
          disabled={workout.trim().length === 0}
          onClick={handleGenerate}
          className="w-full rounded-full bg-green-500 px-8 py-4 font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Generate Playlist
        </button>
      </div>
    </main>
  );
}