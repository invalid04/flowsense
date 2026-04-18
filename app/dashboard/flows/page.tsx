"use client";

import { useEffect, useMemo, useState } from "react";

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

const CRITICAL_DROPOFF_THRESHOLD = 20;
const WARNING_DROPOFF_THRESHOLD = 10;

type DropSeverity = "critical" | "warning";

function getDropSeverity(drop: number | undefined): DropSeverity | null {
  if (drop === undefined) return null;
  if (drop >= CRITICAL_DROPOFF_THRESHOLD) return "critical";
  if (drop >= WARNING_DROPOFF_THRESHOLD) return "warning";
  return null;
}

function getTopDropoff(flow: Flow) {
  const ranked = flow.stages
    .map((stage, index) => ({
      stage,
      index,
      drop: index > 0 ? flow.stages[index - 1].drop ?? 0 : 0,
      previousLabel: index > 0 ? flow.stages[index - 1].label : null,
    }))
    .filter((entry) => entry.index > 0)
    .sort((a, b) => b.drop - a.drop);

  return ranked[0] ?? null;
}

function getOptimizationSuggestion(flow: Flow): string {
  const topDrop = getTopDropoff(flow);
  if (!topDrop || topDrop.drop < WARNING_DROPOFF_THRESHOLD || !topDrop.previousLabel) {
    return "Preserve momentum in this modeled path and remove any new optional friction before the next step.";
  }

  const fromLabel = topDrop.previousLabel;
  const toLabel = topDrop.stage.label;
  const fromKey = fromLabel.toLowerCase();
  const toKey = toLabel.toLowerCase();

  if (toKey.includes("checkout") || toKey.includes("payment") || toKey.includes("purchase")) {
    return `Reduce friction between ${fromLabel} and ${toLabel} by shortening payment inputs and tightening trust messaging before continuation.`;
  }

  if (fromKey.includes("pricing") || toKey.includes("pricing")) {
    return `Reduce friction between ${fromLabel} and ${toLabel} by clarifying plan differences and strengthening one primary CTA.`;
  }

  return `Reduce friction between ${fromLabel} and ${toLabel} by removing non-essential decisions before users move forward.`;
}

function getFlowSummary(flow: Flow): string {
  const topDrop = getTopDropoff(flow);
  if (!topDrop || topDrop.drop < WARNING_DROPOFF_THRESHOLD || !topDrop.previousLabel) {
    return "Biggest issue: This flow is stable with no major abandonment points.";
  }

  return `Modeled risk: users drop off between ${topDrop.previousLabel} and ${topDrop.stage.label} (${topDrop.drop.toFixed(0)}%).`;
}

function StageCard({
  stage,
  isLast,
  priorLabel,
  isHighestDropPoint,
}: {
  stage: FlowStage;
  isLast: boolean;
  priorLabel: string | null;
  isHighestDropPoint: boolean;
}) {
  const dropValue = stage.drop ?? 0;
  const severity = !isLast ? getDropSeverity(dropValue) : null;
  const showSeverityLabel = !isLast && severity !== null;

  const toneClass =
    isHighestDropPoint && severity === "critical"
      ? "border-red-400/80 bg-red-950/25 shadow-[0_0_22px_rgba(239,68,68,0.24)]"
      : severity === "warning"
        ? "border-orange-500/60 bg-orange-950/20"
      : stage.tone === "success"
          ? "border-emerald-500/60 bg-emerald-950/20"
          : "border-slate-700 bg-black";

  const tooltip = isHighestDropPoint && dropValue > 0
    ? "Highest drop-off point in this flow"
    : undefined;

  return (
    <div className="flex items-center gap-2">
      <article className={["insights-module-card w-52 rounded-2xl px-3 py-3", toneClass].join(" ")} title={tooltip}>
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
        <p className="mt-1 text-sm text-slate-400">{stage.percent}% remaining</p>
        {isHighestDropPoint && dropValue > 0 ? (
          <p
            className={[
              "mt-1 text-xs font-semibold",
              severity === "critical"
                ? "text-red-200"
                : severity === "warning"
                  ? "text-orange-200"
                  : "text-slate-300",
            ].join(" ")}
          >
            Highest drop-off point in this flow
          </p>
        ) : null}
      </article>

      {showSeverityLabel && stage.drop !== undefined ? (
          <p className={severity === "critical" ? "whitespace-nowrap text-sm font-semibold text-red-300" : "whitespace-nowrap text-sm font-semibold text-orange-300"}>
            {severity === "critical" ? "CRITICAL:" : "WARNING:"} {stage.drop.toFixed(0)}% of users abandon here
            {priorLabel ? ` (${priorLabel} -> ${stage.label})` : ""}
          </p>
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

    void load();
  }, []);

  const biggestDropoffPoint = useMemo(() => {
    if (!data) return 0;

    const highestPerFlow = data.flows.map((flow) =>
      flow.stages.reduce((highest, stage) => Math.max(highest, stage.drop ?? 0), 0)
    );

    if (highestPerFlow.length === 0) return 0;
    return Math.max(...highestPerFlow);
  }, [data]);

  return (
    <div className="space-y-8">
      <section className="insights-module-card insights-card-indicator animate-rise rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="insights-module-header">
            <p className="insights-module-label">FLOWSENSE - FLOW MODELING</p>
            <h1 className="insights-module-title">Conversion Flows</h1>
            <p className="insights-module-support">See where users abandon and what to optimize first.</p>
            <div className="insights-signal-bars w-24">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="insights-btn-secondary">Filter</button>
            <button className="insights-btn-secondary">Export</button>
            <button className="insights-btn">+ New Flow</button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="insights-metric-card insights-card-indicator rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Active Flows</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? data.metrics.activeFlows.toLocaleString() : loading ? "..." : "0"}
          </p>
          <p className="mt-1 text-xs text-slate-400">Distinct modeled path sets</p>
        </article>
        <article className="insights-metric-card insights-card-indicator rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Avg. Completion</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? `${data.metrics.avgCompletion.toFixed(1)}%` : loading ? "..." : "0.0%"}
          </p>
          <p className="mt-1 text-xs text-slate-400">Modeled entry-to-end progression</p>
        </article>
        <article className="insights-metric-card insights-card-indicator rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Biggest Drop-off</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? `${biggestDropoffPoint.toFixed(1)}%` : loading ? "..." : "0.0%"}
          </p>
          <p className="mt-1 text-xs text-slate-400">Highest abandon point by stage</p>
        </article>
        <article className="insights-metric-card insights-card-indicator rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Conversion Rate</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? `${data.metrics.conversionRate.toFixed(1)}%` : loading ? "..." : "0.0%"}
          </p>
          <p className="mt-1 text-xs text-slate-400">System conversion baseline</p>
        </article>
      </section>

      <section className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">FLOWSENSE - MODELED PATHS</p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-100">Modeled Paths</h2>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-sm text-slate-300">
          {data ? `${data.flows.length} flows` : "..."}
        </span>
      </section>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-400">Loading flows...</p> : null}

      {!loading && !error ? (
        <section className="space-y-4">
          {(data?.flows ?? []).map((flow) => (
            (() => {
              const topDrop = getTopDropoff(flow);
              const highestDropIndex = topDrop?.index ?? -1;

              return (
                <article key={flow.name} className="insights-module-card insights-card-indicator rounded-2xl p-5">
                  <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Modeled Path</p>
                  <h3 className="text-3xl font-semibold tracking-tight text-slate-100">{flow.name}</h3>
                  <p className="mt-2 text-sm text-slate-200">{getFlowSummary(flow)}</p>
                  <div className="custom-scroll-x mt-4 overflow-x-auto pb-2">
                    <div className="inline-flex min-w-full items-start gap-2">
                      {flow.stages.map((stage, index) => (
                        <StageCard
                          key={`${flow.name}-${stage.label}-${index}`}
                          stage={stage}
                          isLast={index === flow.stages.length - 1}
                          priorLabel={index > 0 ? flow.stages[index - 1].label : null}
                          isHighestDropPoint={index === highestDropIndex}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="insights-system-card mt-4 rounded-xl p-3">
                    <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Optimization Direction</p>
                    <p className="mt-1 text-sm text-slate-200">{getOptimizationSuggestion(flow)}</p>
                  </div>
                </article>
              );
            })()
          ))}
        </section>
      ) : null}
    </div>
  );
}
