type DropoffCandidate = {
  stateId: string;
  stateName: string;
  incomingCount: number;
  outgoingCount: number;
};

type DropoffInsightCardProps = {
  biggestDropoff: DropoffCandidate | null;
  candidateCount: number;
};

export function DropoffInsightCard({
  biggestDropoff,
  candidateCount,
}: DropoffInsightCardProps) {
  return (
    <div className="glass-panel h-full rounded-3xl p-5 md:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Biggest Drop-Off</h2>
      <p className="mt-1 text-sm text-slate-500">
        Where users enter but do not continue.
      </p>

      {biggestDropoff ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
            Drop-off State
          </p>
          <p className="font-mono text-xl font-bold text-slate-900">
            {biggestDropoff.stateName}
          </p>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p className="rounded-xl bg-slate-50 px-3 py-2">
              <span className="font-semibold text-slate-700">Incoming:</span>{" "}
              {biggestDropoff.incomingCount.toLocaleString()}
            </p>
            <p className="rounded-xl bg-slate-50 px-3 py-2">
              <span className="font-semibold text-slate-700">Outgoing:</span>{" "}
              {biggestDropoff.outgoingCount.toLocaleString()}
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Total drop-off candidates: {candidateCount.toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4 text-sm text-slate-600">
          No drop-off states detected yet.
        </div>
      )}
    </div>
  );
}
