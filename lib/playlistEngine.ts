export type Track = {
  id: string;
  uri: string;
  name: string;
  artist: string;
  duration_ms: number;
  album_image: string | null;
};

export type PlaylistPhase = {
  name: "warmup" | "main" | "cooldown";
  tracks: Track[];
  duration_ms: number;
  target_ms: number;
};

export type PlaylistResult = {
  tracks: Track[];
  phases: PlaylistPhase[];
  total_duration_ms: number;
  target_duration_ms: number;
  difference_ms: number;
};

function shuffleTracks(tracks: Track[]) {
  const shuffled = [...tracks];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [
      shuffled[j],
      shuffled[i],
    ];
  }

  return shuffled;
}

function fillPhase(
  availableTracks: Track[],
  targetMinutes: number
): {
  selected: Track[];
  remaining: Track[];
  durationMs: number;
} {
  const targetMs = targetMinutes * 60 * 1000;

  const selected: Track[] = [];
  const remaining = [...availableTracks];

  let durationMs = 0;

  while (remaining.length > 0) {
    let bestIndex = -1;

    // How far away we are if we stop adding songs right now.
    let bestDifference = Math.abs(
      targetMs - durationMs
    );

    const candidateWindow = Math.min(6, remaining.length);

    for (let i = 0; i < candidateWindow; i++) {
      const potentialDuration =
        durationMs + remaining[i].duration_ms;

      const difference = Math.abs(
        targetMs - potentialDuration
      );

      // Only choose a track if adding it moves
      // the phase closer to its target duration.
      if (difference < bestDifference) {
        bestDifference = difference;
        bestIndex = i;
      }
    }

    // If every remaining song would make the
    // duration worse, stop this phase here.
    if (bestIndex === -1) {
      break;
    }

    const [track] = remaining.splice(bestIndex, 1);

    selected.push(track);
    durationMs += track.duration_ms;
  }

  return {
    selected,
    remaining,
    durationMs,
  };
}

export function generatePlaylist(
  candidates: Track[],
  targetMinutes: number,
  warmupMinutes?: number,
  mainMinutes?: number,
  cooldownMinutes?: number
): PlaylistResult {
  // Remove unusually short or long tracks.
  const usableTracks = candidates.filter(
    (track) =>
      track.duration_ms >= 90_000 &&
      track.duration_ms <= 420_000
  );

  const shuffled = shuffleTracks(usableTracks);

  // Use WorkoutProfile phase durations when available.
  // Otherwise fall back to approximately 10/80/10.
  const warmupTarget =
    warmupMinutes ??
    Math.max(3, Math.round(targetMinutes * 0.1));

  const cooldownTarget =
    cooldownMinutes ??
    Math.max(3, Math.round(targetMinutes * 0.1));

  const mainTarget =
    mainMinutes ??
    targetMinutes - warmupTarget - cooldownTarget;

  const warmup = fillPhase(
    shuffled,
    warmupTarget
  );

  const main = fillPhase(
    warmup.remaining,
    mainTarget
  );

  const cooldown = fillPhase(
    main.remaining,
    cooldownTarget
  );

  const phases: PlaylistPhase[] = [
    {
      name: "warmup",
      tracks: warmup.selected,
      duration_ms: warmup.durationMs,
      target_ms: warmupTarget * 60 * 1000,
    },
    {
      name: "main",
      tracks: main.selected,
      duration_ms: main.durationMs,
      target_ms: mainTarget * 60 * 1000,
    },
    {
      name: "cooldown",
      tracks: cooldown.selected,
      duration_ms: cooldown.durationMs,
      target_ms: cooldownTarget * 60 * 1000,
    },
  ];

  const tracks = phases.flatMap(
    (phase) => phase.tracks
  );

  const totalDurationMs = tracks.reduce(
    (total, track) => total + track.duration_ms,
    0
  );

  const targetDurationMs =
    targetMinutes * 60 * 1000;

  return {
    tracks,
    phases,
    total_duration_ms: totalDurationMs,
    target_duration_ms: targetDurationMs,
    difference_ms: Math.abs(
      targetDurationMs - totalDurationMs
    ),
  };
}