import { buildInsightText } from "@/lib/insightText";

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
  totalDropoffCount: number;
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

export function DropoffInsightCard({
  biggestDropoff,
  totalTransitions,
  totalDropoffCount,
  impactLevel,
}: DropoffInsightCardProps) {
  const impact = impactBadge(impactLevel);
  const cardClass = impactCardClass(impactLevel);
  const headlineClass =
    impactLevel === "high"
      ? "text-[2.1rem] font-extrabold text-slate-100"
      : impactLevel === "low"
        ? "text-2xl font-semibold text-slate-200"
        : "text-2xl font-bold text-slate-100";

  if (!biggestDropoff) {
    const fallbackInsight = buildInsightText({
      fromState: "/home",
      toState: "Checkout",
      transitionCount: 0,
      nextStepCount: 0,
      totalDropoffs: 0,
      totalTransitions,
      headline: "Checkout is your largest drop-off point",
      action: "Track at least 100 sessions through Checkout, then remove one non-essential field and measure completion lift.",
    });

    return (
      <article className={`insights-feed-card insights-card-indicator animate-rise p-6 md:p-7 ${cardClass}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-300 uppercase">Decision Signal</p>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${impact.className}`}>
            {impact.icon} {impact.label}
          </span>
        </div>
        <p className={`mt-3 text-balance leading-tight tracking-tight md:text-[2rem] ${headlineClass}`}>
          {fallbackInsight.headline}
        </p>
        <p className="mt-4 text-sm text-slate-200">{fallbackInsight.keyMetric}</p>
        <p className="mt-3 text-sm text-slate-300">{fallbackInsight.context}</p>
        <p className="mt-3 text-sm text-slate-200">{fallbackInsight.impact}</p>
        <p className="mt-3 text-sm font-semibold text-slate-100">Estimated impact: +0-0%</p>
        <p className="mt-3 text-sm text-slate-300">
          <span className="font-semibold text-slate-100">Recommended action: </span>
          {fallbackInsight.recommendedAction}
        </p>
      </article>
    );
  }

  const fromLabel = biggestDropoff.leadingFromState ? toReadableStateLabel(biggestDropoff.leadingFromState) : null;
  const toLabel = toReadableStateLabel(biggestDropoff.stateName);
  const fromState = fromLabel ?? "Unknown step";
  const transitionCount = biggestDropoff.leadingEdgeCount > 0 ? biggestDropoff.leadingEdgeCount : biggestDropoff.incomingCount;
  const summaryInsight = buildInsightText({
    fromState,
    toState: toLabel,
    transitionCount,
    nextStepCount: biggestDropoff.outgoingCount,
    totalDropoffs: totalDropoffCount,
    totalTransitions,
    action: `Reduce required fields, simplify form steps after ${fromState}, and reinforce payment security and guarantee copy at ${toLabel}.`,
  });

  return (
    <article className={`insights-feed-card insights-card-indicator animate-rise p-6 md:p-7 ${cardClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.12em] text-slate-300 uppercase">Decision Signal</p>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${impact.className}`}>
          {impact.icon} {impact.label}
        </span>
      </div>
      <p className={`mt-3 text-balance leading-tight tracking-tight md:text-[2rem] ${headlineClass}`}>
        {summaryInsight.headline}
      </p>
      <p className="mt-4 text-sm text-slate-200">{summaryInsight.keyMetric}</p>
      <p className="mt-3 text-sm text-slate-300">{summaryInsight.context}</p>
      <p className="mt-3 text-sm text-slate-200">{summaryInsight.impact}</p>
      <p className="mt-3 text-sm font-semibold text-slate-100">
        Estimated impact: +{summaryInsight.estimatedLiftLow}-{summaryInsight.estimatedLiftHigh}%
      </p>
      <p className="mt-3 text-sm text-slate-300">
        <span className="font-semibold text-slate-100">Recommended action: </span>
        {summaryInsight.recommendedAction}
      </p>

      <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
        <span>
          Inputs: {summaryInsight.fromState} -&gt; {summaryInsight.toState} | {summaryInsight.transitionCount} -&gt; {summaryInsight.nextStepCount}
        </span>
        <a href="#supporting-data" className="font-semibold text-slate-200 hover:text-slate-100">
          View details
        </a>
      </div>
    </article>
  );
}
