import { buildInsightText } from "@/lib/insightText";

type ImpactLevel = "high" | "medium" | "low";

type LoopInsight = {
  type: "two-state" | "self";
  states: string[];
  totalCount: number;
};

type LoopInsightCardProps = {
  topLoop: LoopInsight | null;
  error: string | null;
  totalTransitions: number;
  impactLevel: ImpactLevel;
};

function toReadableStateLabel(state: string): string {
  const segments = state.split("/").filter(Boolean);
  const leaf = segments.length > 0 ? segments[segments.length - 1] : state;
  return leaf.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatLoopLabel(loop: LoopInsight): string {
  const first = toReadableStateLabel(loop.states[0]);

  if (loop.type === "self") {
    return `${first} <-> ${first}`;
  }

  const second = toReadableStateLabel(loop.states[1]);
  return `${first} <-> ${second}`;
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
    return "border-white/30 scale-[1.01] shadow-[0_14px_30px_rgba(0,0,0,0.34)] bg-white/[0.035]";
  }
  if (impactLevel === "low") {
    return "border-white/10 opacity-90";
  }
  return "border-white/15";
}

export function LoopInsightCard({ topLoop, error, totalTransitions, impactLevel }: LoopInsightCardProps) {
  const impact = impactBadge(impactLevel);
  const cardClass = impactCardClass(impactLevel);
  const headlineClass =
    impactLevel === "high"
      ? "text-[2.1rem] font-extrabold text-slate-100"
      : impactLevel === "low"
        ? "text-2xl font-semibold text-slate-200"
        : "text-2xl font-bold text-slate-100";

  if (error) {
    return (
      <article className={`insights-feed-card insights-card-indicator animate-rise p-6 md:p-7 ${cardClass}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-300 uppercase">Decision Signal</p>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${impact.className}`}>
            {impact.icon} {impact.label}
          </span>
        </div>
        <p className="mt-4 text-sm text-rose-300">{error}</p>
      </article>
    );
  }

  if (!topLoop) {
    const fallbackInsight = buildInsightText({
      fromState: "Decision",
      toState: "Decision",
      transitionCount: 0,
      nextStepCount: 0,
      totalDropoffs: totalTransitions,
      totalTransitions,
      headline: "No major hesitation loop detected",
      keyMetric: "0% of transitions repeat a loop (0 loop transitions).",
      context: "Current modeled transitions move forward without repeat cycles at key decision points.",
      impact: `Loop-driven friction contributes 0% across ${totalTransitions.toLocaleString()} modeled transitions.`,
      estimatedImpact: "Reducing this step could increase conversions by +0-0%.",
      action: "Keep CTA hierarchy explicit as you ship new screens and pricing paths.",
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

  const fromState = toReadableStateLabel(topLoop.states[0]);
  const toState =
    topLoop.type === "self" ? fromState : toReadableStateLabel(topLoop.states[1]);
  const loopShare = totalTransitions > 0 ? (topLoop.totalCount / totalTransitions) * 100 : 0;
  const loopInsight = buildInsightText({
    fromState,
    toState,
    transitionCount: topLoop.totalCount,
    nextStepCount: 0,
    totalDropoffs: totalTransitions,
    totalTransitions,
    headline: `${formatLoopLabel(topLoop)} is creating repeated hesitation`,
    keyMetric: `${loopShare.toFixed(1)}% of transitions repeat this loop (${topLoop.totalCount.toLocaleString()} loop transitions).`,
    context: `This loop (${fromState} -> ${toState}) sits in your primary progression path and delays forward movement.`,
    impact: `This loop contributes ${Math.round((topLoop.totalCount / Math.max(totalTransitions, 1)) * 100)}% of modeled friction across ${totalTransitions.toLocaleString()} transitions.`,
    action: `Differentiate ${fromState} and ${toState} with one primary CTA, tighter page purpose, and explicit next-step copy.`,
  });

  return (
    <article className={`insights-feed-card insights-card-indicator animate-rise p-7 md:p-8 ${cardClass}`}>
      <div className="mb-4 h-0.5 w-16 rounded-full bg-white/20" aria-hidden="true" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.12em] text-slate-300 uppercase">Decision Signal</p>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${impact.className}`}>
          {impact.icon} {impact.label}
        </span>
      </div>
      <p className={`mt-4 text-balance leading-tight tracking-tight md:text-[2rem] ${headlineClass}`}>
        {loopInsight.headline}
      </p>
      <p className="mt-4 text-sm text-slate-200">{loopInsight.keyMetric}</p>
      <p className="mt-3 text-sm text-slate-300">{loopInsight.context}</p>
      <p className="mt-3 text-sm text-slate-200">{loopInsight.impact}</p>
      <p className="mt-3 text-sm font-semibold text-slate-100">
        Estimated impact: +{loopInsight.estimatedLiftLow}-{loopInsight.estimatedLiftHigh}%
      </p>
      <p className="mt-3 text-sm text-slate-300">
        <span className="font-semibold text-slate-100">Recommended action: </span>
        {loopInsight.recommendedAction}
      </p>

      <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
        <span>
          Inputs: {loopInsight.fromState} -&gt; {loopInsight.toState} | {loopInsight.transitionCount} -&gt; {loopInsight.nextStepCount}
        </span>
        <a href="#supporting-data" className="font-semibold text-slate-200 hover:text-slate-100">
          View details
        </a>
      </div>
    </article>
  );
}
