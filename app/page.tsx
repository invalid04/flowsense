import { headers } from "next/headers";
import { TrackForm } from "./TrackForm";


async function getAnalytics() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/analytics`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch analytics");
  }

  return res.json();
}

type Transition = {
  fromState: string;
  toState: string;
  count: number;
  probability: number;
};

export default async function HomePage() {
  const data = await getAnalytics();
  const transitions: Transition[] = data.transitions ?? [];

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">FlowSense Dashboard</h1>
          <p className="text-sm text-gray-600">
            Transition analytics for your Markov chain project
          </p>
        </div>

        <TrackForm />

        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3">From State</th>
                <th className="px-4 py-3">To State</th>
                <th className="px-4 py-3">Count</th>
                <th className="px-4 py-3">Probability</th>
              </tr>
            </thead>
            <tbody>
              {transitions.length > 0 ? (
                transitions.map((transition, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="px-4 py-3">{transition.fromState}</td>
                    <td className="px-4 py-3">{transition.toState}</td>
                    <td className="px-4 py-3">{transition.count}</td>
                    <td className="px-4 py-3">
                      {(transition.probability * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={4}>
                    No transition data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}