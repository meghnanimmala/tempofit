export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="mb-4 text-sm font-semibold tracking-[0.3em] text-green-400">
          TEMPOFIT
        </p>

        <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
          Music that moves with you.
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-lg text-gray-400">
          Create a personalized Spotify playlist built around your workout,
          your music, and your time.
        </p>

        <a
          href="/api/auth/login"
          className="inline-block rounded-full bg-green-500 px-8 py-4 font-semibold text-black transition hover:bg-green-400"
        >
          Connect with Spotify
        </a>

        <p className="mt-8 text-sm text-gray-500">
          Describe your workout. We&apos;ll handle the playlist.
        </p>
      </div>
    </main>
  );
}