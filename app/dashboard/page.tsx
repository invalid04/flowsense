import { headers } from "next/headers";
import { PredictionPanel } from "./PredictionPanel";
import { UploadForm } from "./UploadForm";
import { StateTransitionsChart } from "./StateTransitionsChart";
import { DropoffInsightCard } from "./DropoffInsightCard";
import { ConversionPathInsightCard } from "./ConversionPathInsightCard";
import { db } from "@/db";
import { sessions as sessionsTable, transitions as transitionsTable } from "@/db/schema";
import { sql } from "drizzle-orm";

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

async function getDropoffInsight() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/insights/dropoff`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch dropoff insight");
  }

  return res.json();
}

type ConversionEndedReason =
  | "reached_conversion_state"
  | "no_outgoing_transitions"
  | "loop_detected"
  | "max_steps_reached";

type ConversionPathInsight = {
  startState: string;
  conversionStates: string[];
  path: string[];
  endedReason: ConversionEndedReason;
};

type ConversionPathResult = {
  insight: ConversionPathInsight | null;
  error: string | null;
};

async function getConversionPathInsight(): Promise<ConversionPathResult> {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  try {
    const res = await fetch(`${protocol}://${host}/api/insights/conversion-path`, {
      cache: "no-store",
    });

    const data = (await res.json()) as Partial<ConversionPathInsight> & { error?: string };

    if (!res.ok) {
      return {
        insight: null,
        error: data.error ?? "Failed to fetch conversion path insight",
      };
    }

    if (
      !data.startState ||
      !Array.isArray(data.conversionStates) ||
      !Array.isArray(data.path) ||
      !data.endedReason
    ) {
      return {
        insight: null,
        error: "Invalid conversion path insight payload",
      };
    }

    return {
      insight: {
        startState: data.startState,
        conversionStates: data.conversionStates,
        path: data.path,
        endedReason: data.endedReason,
      },
      error: null,
    };
  } catch {
    return {
      insight: null,
      error: "Failed to fetch conversion path insight",
    };
  }
}

type Transition = {
  fromState: string;
  toState: string;
  count: number;
  probability: number;
};

type DatasetStatus = {
  sessions: number;
  rows: number;
  lastUpdatedAt: Date | string | null;
};

async function getDatasetStatus(): Promise<DatasetStatus> {
  const [sessionTotals, rowTotals, lastUpdated] = await Promise.all([
    db.select({ value: sql<number>`count(*)` }).from(sessionsTable),
    db.select({ value: sql<number>`count(*)` }).from(transitionsTable),
    db.select({ value: sql<Date | null>`max(${transitionsTable.createdAt})` }).from(
      transitionsTable
    ),
  ]);

  return {
    sessions: Number(sessionTotals[0]?.value ?? 0),
    rows: Number(rowTotals[0]?.value ?? 0),
    lastUpdatedAt: lastUpdated[0]?.value ?? null,
  };
}

export default async function HomePage() {
  const [data, dropoffData, conversionPathResult, datasetStatus] = await Promise.all([
    getAnalytics(),
    getDropoffInsight(),
    getConversionPathInsight(),
    getDatasetStatus(),
  ]);
  const transitions: Transition[] = data.transitions ?? [];
  const biggestDropoff = dropoffData.biggestDropoff ?? null;
  const dropoffCandidates = dropoffData.candidates ?? [];
  const { insight: conversionPathInsight, error: conversionPathError } =
    conversionPathResult;
  const totalTransitions = transitions.reduce((sum, item) => sum + item.count, 0);
  const uniqueStates = new Set(
    transitions.flatMap((item) => [item.fromState, item.toState])
  ).size;
  const topPath = transitions.reduce<Transition | null>((top, current) => {
    if (!top || current.probability > top.probability) return current;
    return top;
  }, null);
  const parsedLastUpdatedAt =
    datasetStatus.lastUpdatedAt instanceof Date
      ? datasetStatus.lastUpdatedAt
      : datasetStatus.lastUpdatedAt
        ? new Date(datasetStatus.lastUpdatedAt)
        : null;
  const hasValidLastUpdatedAt =
    parsedLastUpdatedAt !== null && !Number.isNaN(parsedLastUpdatedAt.getTime());
  const lastUpdatedLabel = hasValidLastUpdatedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(parsedLastUpdatedAt)
    : "No events yet";

  return (
    <main className="enterprise-grid min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[96rem] space-y-6">
        <section
          className="glass-panel animate-rise overflow-hidden rounded-3xl p-6 md:p-8"
          style={{ animationDelay: "40ms" }}
        >
          <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
                ENTERPRISE ANALYTICS
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                FlowSense Intelligence Console
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                Behavioral Prediction Engine
              </p>
            </div>
            <div className="self-start rounded-2xl border border-[var(--panel-border)] bg-white/70 px-4 py-3">
              <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
                Active Dataset
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                Rows: {datasetStatus.rows.toLocaleString()} | Sessions:{" "}
                {datasetStatus.sessions.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">Updated {lastUpdatedLabel}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            <div className="badge-kpi rounded-2xl p-4">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Active Sessions
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {datasetStatus.sessions.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-12">
          <div className="animate-rise lg:col-span-7" style={{ animationDelay: "120ms" }}>
            <ConversionPathInsightCard
              insight={conversionPathInsight}
              error={conversionPathError}
            />
          </div>
          <div className="animate-rise lg:col-span-5" style={{ animationDelay: "160ms" }}>
            <DropoffInsightCard
              biggestDropoff={biggestDropoff}
              candidateCount={dropoffCandidates.length}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="animate-rise max-w-4xl" style={{ animationDelay: "200ms" }}>
            <PredictionPanel />
          </div>
          <div className="animate-rise" style={{ animationDelay: "240ms" }}>
            <StateTransitionsChart />
          </div>
          <div
            className="glass-panel animate-rise overflow-hidden rounded-3xl"
            style={{ animationDelay: "280ms" }}
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
          <div className="animate-rise" style={{ animationDelay: "320ms" }}>
            <UploadForm />
          </div>
        </section>
      </div>
    </main>
  );
}
