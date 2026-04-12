type LoopInsight = {
  type: "two-state" | "self";
  states: string[];
  totalCount: number;
};

type LoopInsightCardProps = {
  topLoop: LoopInsight | null;
  error: string | null;
};

function formatLoopLabel(loop: LoopInsight): string {
  if (loop.type === "self") {
    return `${loop.states[0]} ↻`;
  }

  const [fromState, toState] = loop.states;
  return `${fromState} ↔ ${toState}`;
}

export function LoopInsightCard({ topLoop, error }: LoopInsightCardProps) {
  return (
    <div className="glass-panel flex h-full min-h-[17.5rem] flex-col rounded-3xl p-5 md:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Loop Detection</h2>
      <p className="mt-1 min-h-10 text-sm text-slate-500">
        Strongest repeated cycle in your flow.
      </p>

      {error ? (
        <div className="mt-4 flex-1 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : topLoop ? (
        <div className="mt-4 flex-1 space-y-3 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
            Top Loop
          </p>
          <p className="font-mono text-xl font-bold text-slate-900">
            {formatLoopLabel(topLoop)}
          </p>
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
            <span className="font-semibold text-slate-700">Loop Count:</span>{" "}
            {topLoop.totalCount.toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="mt-4 flex-1 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4 text-sm text-slate-600">
          No loops detected yet.
        </div>
      )}
    </div>
  );
}
