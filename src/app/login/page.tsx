export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="text-center">
        <h1 className="text-4xl font-bold">GearTracker</h1>
        <p className="mt-4 text-lg text-zinc-600">
          Track wear on your bike components
        </p>
        <a
          href="/api/auth/strava"
          className="mt-8 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
        >
          Connect with Strava
        </a>
      </main>
    </div>
  );
}
