type ImpactLevel = "high" | "medium" | "low";

type DropoffCandidate = {
  stateId: string;
  stateName: string;
  incomingCount: number;
  outgoingCount: number;
  leadingFromState: string | null;
  leadingEdgeCount: number;
};

type DropoffInsightCardProps = {
  biggestDropoff: DropoffCandidate | null;
  totalTransitions: number;
  impactLevel: ImpactLevel;
};

function toReadableStateLabel(state: string): string {
  const segments = state.split("/").filter(Boolean);
  const leaf = segments.length > 0 ? segments[segments.length - 1] : state;

  return leaf.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function impactBadge(impactLevel: ImpactLevel) {
  if (impactLevel === "high") {
    return { label: "High Impact", icon: "??", className: "border-red-300/50 bg-red-500/20 text-red-100" };
  }
  if (impactLevel === "medium") {
    return { label: "Medium Impact", icon: "??", className: "border-amber-300/50 bg-amber-500/20 text-amber-100" };
  }
  return { label: "Low Impact", icon: "??", className: "border-emerald-300/50 bg-emerald-500/20 text-emerald-100" };
}

export function DropoffInsightCard({ biggestDropoff, totalTransitions, impactLevel }: DropoffInsightCardProps) {
  const impact = impactBadge(impactLevel);

  if (!biggestDropoff) {
    return (
      <article className="insights-feed-card insights-feed-card--dropoff animate-rise p-6 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.04em] text-orange-200">Problem</p>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${impact.className}`}>
            {impact.icon} {impact.label}
          </span>
        </div>
        <p className="mt-3 text-balance text-2xl leading-tight font-bold tracking-tight text-orange-100 md:text-[2rem]">
          Checkout friction not yet confirmed
        </p>
        <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Metric</p>
        <p className="mt-1 text-sm text-slate-200">Collect more traffic to isolate the biggest conversion leak.</p>
        <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Likely Cause</p>
        <p className="mt-1 text-sm text-slate-300">Current data volume is too low for confidence.</p>
        <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Suggested Fix</p>
        <p className="mt-1 text-sm text-slate-300">Keep tracking and revisit once higher-volume paths stabilize.</p>
      </article>
    );
  }

  const fromLabel = biggestDropoff.leadingFromState ? toReadableStateLabel(biggestDropoff.leadingFromState) : null;
  const toLabel = toReadableStateLabel(biggestDropoff.stateName);
  const transitionLabel = fromLabel ? `${fromLabel} -> ${toLabel}` : toLabel;

  const shareOfModel = totalTransitions > 0 ? (biggestDropoff.incomingCount / totalTransitions) * 100 : 0;

  return (
    <article className="insights-feed-card insights-feed-card--dropoff animate-rise p-6 md:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.04em] text-orange-200">Problem</p>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${impact.className}`}>
          {impact.icon} {impact.label}
        </span>
      </div>
      <p className="mt-3 text-balance text-2xl leading-tight font-bold tracking-tight text-orange-100 md:text-[2rem]">
        Checkout is killing your conversions
      </p>
      <p className="mt-2 text-sm text-slate-200">Critical step: {transitionLabel}</p>

      <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Metric</p>
      <p className="mt-1 text-sm text-slate-200">
        {shareOfModel.toFixed(1)}% of modeled transitions end at this drop-off point ({biggestDropoff.incomingCount.toLocaleString()} users).
      </p>

      <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Likely Cause</p>
      <p className="mt-1 text-sm text-slate-300">Users likely hit trust, complexity, or form friction at this handoff.</p>

      <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Suggested Fix</p>
      <p className="mt-1 text-sm text-slate-300">
        Reduce required fields, tighten copy around value and security, and remove non-essential steps before completion.
      </p>

      <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
        <span>Impact driver: high drop-off + high traffic</span>
        <a href="#supporting-data" className="font-semibold text-orange-200 hover:text-orange-100">
          View details
        </a>
      </div>
    </article>
  );
}
