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
    return { label: "High Impact", icon: "HIGH", className: "border-white/20 bg-white/10 text-white" };
  }
  if (impactLevel === "medium") {
    return { label: "Medium Impact", icon: "MED", className: "border-white/15 bg-white/5 text-white/80" };
  }
  return { label: "Low Impact", icon: "LOW", className: "border-white/10 bg-white/5 text-white/60" };
}

function impactCardClass(impactLevel: ImpactLevel) {
  if (impactLevel === "high") {
    return "border-white/20 scale-[1.01] shadow-[0_14px_30px_rgba(0,0,0,0.34)]";
  }
  if (impactLevel === "low") {
    return "border-white/10 opacity-90";
  }
  return "border-white/15";
}

export function DropoffInsightCard({ biggestDropoff, totalTransitions, impactLevel }: DropoffInsightCardProps) {
  const impact = impactBadge(impactLevel);
  const cardClass = impactCardClass(impactLevel);
  const headlineClass =
    impactLevel === "high"
      ? "text-[2.1rem] font-extrabold text-slate-100"
      : impactLevel === "low"
        ? "text-2xl font-semibold text-slate-200"
        : "text-2xl font-bold text-slate-100";

  if (!biggestDropoff) {
    return (
      <article className={`insights-feed-card insights-card-indicator animate-rise p-6 md:p-7 ${cardClass}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-300 uppercase">Decision Signal</p>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${impact.className}`}>
            {impact.icon} {impact.label}
          </span>
        </div>
        <p className={`mt-3 text-balance leading-tight tracking-tight md:text-[2rem] ${headlineClass}`}>
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
    <article className={`insights-feed-card insights-card-indicator animate-rise p-6 md:p-7 ${cardClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.12em] text-slate-300 uppercase">Decision Signal</p>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${impact.className}`}>
          {impact.icon} {impact.label}
        </span>
      </div>
      <p className={`mt-3 text-balance leading-tight tracking-tight md:text-[2rem] ${headlineClass}`}>
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
        <a href="#supporting-data" className="font-semibold text-slate-200 hover:text-slate-100">
          View details
        </a>
      </div>
    </article>
  );
}
