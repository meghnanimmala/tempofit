export type WorkoutProfile = {
  workout_type: "strength" | "cardio" | "hiit" | "general";
  focus: string;
  intensity: number;
  duration_minutes: number;
  preferred_genres: string[];
  warmup_minutes: number;
  main_minutes: number;
  cooldown_minutes: number;
};

const genreKeywords: Record<string, string> = {
  rap: "Rap",
  hiphop: "Rap",
  "hip hop": "Rap",
  rock: "Rock",
  "r&b": "R&B",
  rnb: "R&B",
  pop: "Pop",
  indie: "Indie",
  edm: "EDM",
  electronic: "EDM",
  country: "Country",
  alternative: "Alternative",
};

export function parseWorkout(
  description: string,
  duration: number,
  savedGenres: string[]
): WorkoutProfile {
  const text = description.toLowerCase();

  // Determine workout type
  let workoutType: WorkoutProfile["workout_type"] = "general";

  if (
    text.includes("hiit") ||
    text.includes("interval") ||
    text.includes("circuit")
  ) {
    workoutType = "hiit";
  } else if (
    text.includes("run") ||
    text.includes("jog") ||
    text.includes("cardio") ||
    text.includes("cycling") ||
    text.includes("bike")
  ) {
    workoutType = "cardio";
  } else if (
    text.includes("lift") ||
    text.includes("strength") ||
    text.includes("squat") ||
    text.includes("bench") ||
    text.includes("deadlift") ||
    text.includes("rdl") ||
    text.includes("leg day") ||
    text.includes("upper body")
  ) {
    workoutType = "strength";
  }

  // Determine workout focus
  let focus = "full body";

  if (
    text.includes("leg") ||
    text.includes("squat") ||
    text.includes("rdl") ||
    text.includes("lower body")
  ) {
    focus = "legs";
  } else if (
    text.includes("chest") ||
    text.includes("bench")
  ) {
    focus = "chest";
  } else if (
    text.includes("back") ||
    text.includes("pull")
  ) {
    focus = "back";
  } else if (
    text.includes("arm") ||
    text.includes("bicep") ||
    text.includes("tricep")
  ) {
    focus = "arms";
  } else if (
    text.includes("upper body")
  ) {
    focus = "upper body";
  }

  // Determine intensity
  let intensity = 0.6;

  if (
    text.includes("heavy") ||
    text.includes("intense") ||
    text.includes("high intensity") ||
    text.includes("high-intensity") ||
    text.includes("hype") ||
    text.includes("hard")
  ) {
    intensity = 0.85;
  } else if (
    text.includes("easy") ||
    text.includes("light") ||
    text.includes("recovery") ||
    text.includes("chill")
  ) {
    intensity = 0.35;
  } else if (
    text.includes("moderate") ||
    text.includes("medium")
  ) {
    intensity = 0.6;
  }

  // Look for genres explicitly mentioned in the workout description
  const promptGenres: string[] = [];

  for (const [keyword, genre] of Object.entries(genreKeywords)) {
    if (text.includes(keyword) && !promptGenres.includes(genre)) {
      promptGenres.push(genre);
    }
  }

  // Genres in the workout prompt override stored preferences.
  const preferredGenres =
    promptGenres.length > 0 ? promptGenres : savedGenres;

  // Divide workout into phases.
  const warmupMinutes = Math.max(3, Math.round(duration * 0.1));
  const cooldownMinutes = Math.max(3, Math.round(duration * 0.1));
  const mainMinutes = duration - warmupMinutes - cooldownMinutes;

  return {
    workout_type: workoutType,
    focus,
    intensity,
    duration_minutes: duration,
    preferred_genres: preferredGenres,
    warmup_minutes: warmupMinutes,
    main_minutes: mainMinutes,
    cooldown_minutes: cooldownMinutes,
  };
}