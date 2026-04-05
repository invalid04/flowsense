import { headers } from "next/headers";
import { TrackForm } from "./TrackForm";
import { PredictionPanel } from "./PredictionPanel";
import { UploadForm } from "./UploadForm";
import { StateTransitionsChart } from "./StateTransitionsChart";

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
  const totalTransitions = transitions.reduce((sum, item) => sum + item.count, 0);
  const uniqueStates = new Set(
    transitions.flatMap((item) => [item.fromState, item.toState])
  ).size;
  const topPath = transitions.reduce<Transition | null>((top, current) => {
    if (!top || current.probability > top.probability) return current;
    return top;
  }, null);

  return (
    <main className="enterprise-grid min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section
          className="glass-panel animate-rise overflow-hidden rounded-3xl p-6 md:p-8"
          style={{ animationDelay: "40ms" }}
        >
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
                ENTERPRISE ANALYTICS
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                FlowSense Intelligence Console
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                Observe transition dynamics, validate behavior paths, and feed
                new event streams into your Markov model in one workspace.
              </p>
            </div>
            <div className="animate-glow inline-flex items-center gap-2 self-start rounded-full bg-[var(--good-soft)] px-3 py-1.5 text-xs font-semibold tracking-wide text-[var(--good)]">
              <span className="h-2 w-2 rounded-full bg-[var(--good)]" />
              Live model telemetry
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="badge-kpi rounded-2xl p-4">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                States Mapped
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{uniqueStates}</p>
            </div>
            <div className="badge-kpi rounded-2xl p-4">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Transition Volume
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalTransitions.toLocaleString()}
              </p>
            </div>
            <div className="badge-kpi rounded-2xl p-4">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Top Predicted Path
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-800 md:text-base">
                {topPath
                  ? `${topPath.fromState} -> ${topPath.toState} (${(
                      topPath.probability * 100
                    ).toFixed(1)}%)`
                  : "No transitions yet"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="animate-rise" style={{ animationDelay: "120ms" }}>
            <TrackForm />
          </div>
          <div className="animate-rise" style={{ animationDelay: "180ms" }}>
            <PredictionPanel />
          </div>
          <div className="animate-rise lg:col-span-2" style={{ animationDelay: "240ms" }}>
            <StateTransitionsChart />
          </div>
          <div className="animate-rise lg:col-span-2" style={{ animationDelay: "300ms" }}>
            <UploadForm />
          </div>
        </section>

        <div
          className="glass-panel animate-rise overflow-hidden rounded-3xl"
          style={{ animationDelay: "360ms" }}
        >
          <div className="border-b border-[var(--panel-border)] px-5 py-4 md:px-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Transition Registry
            </h2>
            <p className="text-sm text-slate-500">
              Latest calculated edges from your loaded sessions
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--panel-border)] bg-slate-50/70">
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-600 uppercase md:px-6">
                    From State
                  </th>
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-600 uppercase md:px-6">
                    To State
                  </th>
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-600 uppercase md:px-6">
                    Count
                  </th>
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-600 uppercase md:px-6">
                    Probability
                  </th>
                </tr>
              </thead>
              <tbody>
                {transitions.length > 0 ? (
                  transitions.map((transition, index) => (
                    <tr
                      key={`${transition.fromState}-${transition.toState}-${index}`}
                      className="border-b border-[var(--panel-border)]/70 last:border-b-0"
                    >
                      <td className="px-5 py-3 font-mono text-sm md:px-6">
                        {transition.fromState}
                      </td>
                      <td className="px-5 py-3 font-mono text-sm md:px-6">
                        {transition.toState}
                      </td>
                      <td className="px-5 py-3 md:px-6">{transition.count}</td>
                      <td className="px-5 py-3 font-semibold text-[var(--accent)] md:px-6">
                        {(transition.probability * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-8 text-sm text-slate-500 md:px-6" colSpan={4}>
                      No transition data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
