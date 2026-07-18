import { getHealthStatus } from "@/lib/api";

export default async function Home() {
  const data = await getHealthStatus();

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Typeform Clone</h1>

        <p className="mt-4 text-lg">
          Backend status: {data.status}
        </p>
      </div>
    </main>
  );
}
