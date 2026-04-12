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

type ConversionPathInsightCardProps = {
  insight: ConversionPathInsight | null;
  error: string | null;
};

const ENDED_REASON_COPY: Record<ConversionEndedReason, string> = {
  reached_conversion_state: "Ends: conversion",
  no_outgoing_transitions: "Ends: no outgoing transitions",
  loop_detected: "Ends: loop detected",
  max_steps_reached: "Ends: max steps reached",
};

export function ConversionPathInsightCard({
  insight,
  error,
}: ConversionPathInsightCardProps) {
  return (
    <div className="glass-panel h-full rounded-3xl p-5 md:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Conversion Path</h2>
      <p className="mt-1 text-sm text-slate-500">Primary journey signal to conversion.</p>

      {error ? (
        <div className="mt-4 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : insight ? (
        <div className="mt-4 space-y-4 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-5">
          <div className="font-mono text-base leading-relaxed font-semibold text-slate-900 md:text-lg">
            {insight.path.join(" -> ")}
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p className="rounded-xl bg-slate-50 px-3 py-2">
              <span className="font-semibold text-slate-700">Start:</span> {insight.startState}
            </p>
            <p className="rounded-xl bg-slate-50 px-3 py-2">
              <span className="font-semibold text-slate-700">
                {ENDED_REASON_COPY[insight.endedReason]}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
              Conversion States
            </span>
            {insight.conversionStates.map((state) => (
              <span
                key={state}
                className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 font-mono text-xs font-semibold text-[var(--accent-strong)]"
              >
                {state}
              </span>
            ))}
          </div>

          {insight.endedReason === "reached_conversion_state" ? (
            <p className="inline-flex w-fit rounded-full bg-[var(--good-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--good)]">
              Reached a conversion state
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4 text-sm text-slate-600">
          No conversion path insight available yet.
        </div>
      )}
    </div>
  );
}
