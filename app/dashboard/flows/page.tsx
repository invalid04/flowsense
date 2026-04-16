"use client";

import { useEffect, useState } from "react";

type FlowStage = {
  label: string;
  sessions: number;
  percent: number;
  status?: "start" | "end";
  tone?: "neutral" | "drop" | "success";
  drop?: number;
};

type Flow = {
  name: string;
  stages: FlowStage[];
};

type FlowsResponse = {
  metrics: {
    activeFlows: number;
    avgCompletion: number;
    totalDropoffs: number;
    conversionRate: number;
  };
  flows: Flow[];
  error?: string;
};

function StageCard({ stage, isLast }: { stage: FlowStage; isLast: boolean }) {
  const toneClass =
    stage.tone === "drop"
      ? "border-orange-500/60 bg-orange-950/20"
      : stage.tone === "success"
        ? "border-emerald-500/60 bg-emerald-950/20"
        : "border-slate-700 bg-black";

  return (
    <div className="flex items-center gap-2">
      <article className={["w-48 rounded-2xl border px-3 py-3", toneClass].join(" ")}>
        {stage.status ? (
          <span
            className={[
              "inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold",
              stage.status === "start" ? "bg-slate-200 text-black" : "bg-emerald-400 text-black",
            ].join(" ")}
          >
            {stage.status.toUpperCase()}
          </span>
        ) : null}
        <p className="mt-2 text-base font-semibold text-slate-100">{stage.label}</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
          {stage.sessions.toLocaleString()}
          <span className="ml-1 text-sm font-normal text-slate-400">sessions</span>
        </p>
        <div className="mt-2 h-1.5 rounded bg-slate-800">
          <div className="h-full rounded bg-slate-200" style={{ width: `${stage.percent}%` }} />
        </div>
        <p className="mt-1 text-sm text-slate-400">{stage.percent}%</p>
      </article>

      {!isLast && stage.drop !== undefined ? (
        <p className="whitespace-nowrap text-sm font-semibold text-orange-400">-{stage.drop.toFixed(0)}% drop</p>
      ) : null}
      {!isLast ? <span className="text-slate-600">-&gt;</span> : null}
    </div>
  );
}

export default function FlowsPage() {
  const [data, setData] = useState<FlowsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/flows", { cache: "no-store" });
        const json: FlowsResponse = await res.json();

        if (!res.ok) {
          setError(json.error ?? "Failed to load flows");
          setData(null);
          return;
        }

        setData(json);
      } catch {
        setError("Failed to load flows");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-slate-100">User Flows</h1>
          <p className="mt-2 text-2xl text-slate-400">Track how users move through your key conversion paths</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-slate-700 px-4 py-2 text-base font-semibold text-slate-100">Filter</button>
          <button className="rounded-lg border border-slate-700 px-4 py-2 text-base font-semibold text-slate-100">Export</button>
          <button className="rounded-lg bg-slate-100 px-4 py-2 text-base font-semibold text-black">+ New Flow</button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="insights-surface rounded-2xl px-5 py-4">
          <p className="text-sm text-slate-400">Active Flows</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? data.metrics.activeFlows.toLocaleString() : loading ? "..." : "0"}
          </p>
        </article>
        <article className="insights-surface rounded-2xl px-5 py-4">
          <p className="text-sm text-slate-400">Avg. Completion</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? `${data.metrics.avgCompletion.toFixed(1)}%` : loading ? "..." : "0.0%"}
          </p>
        </article>
        <article className="insights-surface rounded-2xl px-5 py-4">
          <p className="text-sm text-slate-400">Total Drop-offs</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? data.metrics.totalDropoffs.toLocaleString() : loading ? "..." : "0"}
          </p>
        </article>
        <article className="insights-surface rounded-2xl px-5 py-4">
          <p className="text-sm text-slate-400">Conversion Rate</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? `${data.metrics.conversionRate.toFixed(1)}%` : loading ? "..." : "0.0%"}
          </p>
        </article>
      </section>

      <section className="flex items-center justify-between">
        <h2 className="text-4xl font-semibold tracking-tight text-slate-100">All Flows</h2>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-sm text-slate-300">
          {data ? `${data.flows.length} flows` : "..."}
        </span>
      </section>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-400">Loading flows...</p> : null}

      {!loading && !error ? (
        <section className="space-y-4">
          {(data?.flows ?? []).map((flow) => (
            <article key={flow.name} className="insights-surface rounded-2xl p-5">
              <h3 className="text-3xl font-semibold tracking-tight text-slate-100">{flow.name}</h3>
              <div className="custom-scroll-x mt-4 overflow-x-auto pb-2">
                <div className="inline-flex min-w-full items-start gap-2">
                  {flow.stages.map((stage, index) => (
                    <StageCard
                      key={`${flow.name}-${stage.label}-${index}`}
                      stage={stage}
                      isLast={index === flow.stages.length - 1}
                    />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
