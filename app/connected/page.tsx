export default function ConnectedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <p className="mb-4 text-sm font-semibold tracking-[0.3em] text-green-400">
          TEMPOFIT
        </p>

        <h1 className="mb-4 text-4xl font-bold">
          Spotify connected successfully.
        </h1>

        <p className="text-gray-400">
          You&apos;re ready to build your workout playlist.
        </p>
      </div>
    </main>
  );
}