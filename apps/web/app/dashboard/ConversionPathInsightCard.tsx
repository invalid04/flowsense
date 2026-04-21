import { buildInsightText } from "@/lib/insightText";

type ImpactLevel = "high" | "medium" | "low";

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
  pathTransitionCount: number;
  pathCompletionCount: number;
};

type ConversionPathInsightCardProps = {
  insight: ConversionPathInsight | null;
  error: string | null;
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

export function ConversionPathInsightCard({
  insight,
  error,
  totalTransitions,
  impactLevel,
}: ConversionPathInsightCardProps) {
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

  if (!insight) {
    const fallbackInsight = buildInsightText({
      fromState: "/home",
      toState: "Conversion",
      transitionCount: 0,
      nextStepCount: 0,
      totalDropoffs: totalTransitions,
      totalTransitions,
      headline: "No dominant conversion path confirmed",
      keyMetric: "0% of modeled traffic follows a stable completion path (0 -> 0 sessions).",
      context: "Path-level guidance needs more consistent session flow from entry to conversion.",
      impact: `This path currently contributes 0% of modeled throughput across ${totalTransitions.toLocaleString()} transitions.`,
      estimatedImpact: "Improving this step could increase conversions by +0-0%.",
      action: "Route traffic through one primary onboarding sequence to build stable path-level signal.",
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

  const readablePath = insight.path.map(toReadableStateLabel);
  const fromState = readablePath[0] ?? "Entry";
  const toState = readablePath[readablePath.length - 1] ?? "Conversion";
  const pathShare = totalTransitions > 0 ? (insight.pathTransitionCount / totalTransitions) * 100 : 0;
  const completionRate =
    insight.pathTransitionCount > 0
      ? (insight.pathCompletionCount / insight.pathTransitionCount) * 100
      : 0;
  const pathHeadlineByEndReason: Record<ConversionEndedReason, string> = {
    reached_conversion_state: `${toState} is your strongest completion path`,
    no_outgoing_transitions: `${toState} is the terminal bottleneck in your primary path`,
    loop_detected: `${toState} path momentum is disrupted by repeat loops`,
    max_steps_reached: `${toState} path needs tighter completion flow`,
  };
  const conversionInsight = buildInsightText({
    fromState,
    toState,
    transitionCount: insight.pathTransitionCount,
    nextStepCount: insight.pathCompletionCount,
    totalDropoffs: totalTransitions,
    totalTransitions,
    headline: pathHeadlineByEndReason[insight.endedReason],
    keyMetric: `${completionRate.toFixed(1)}% of sessions progress through this path segment (${insight.pathTransitionCount.toLocaleString()} -> ${insight.pathCompletionCount.toLocaleString()} sessions).`,
    context: `Primary path: ${readablePath.join(" -> ")}.`,
    impact: `This path handles ${pathShare.toFixed(1)}% of modeled traffic across ${totalTransitions.toLocaleString()} transitions.`,
    action: `Promote this path from high-volume entry pages and remove one extra decision point between ${fromState} and ${toState}.`,
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
        {conversionInsight.headline}
      </p>
      <p className="mt-4 text-sm text-slate-200">{conversionInsight.keyMetric}</p>
      <p className="mt-3 text-sm text-slate-300">{conversionInsight.context}</p>
      <p className="mt-3 text-sm text-slate-200">{conversionInsight.impact}</p>
      <p className="mt-3 text-sm font-semibold text-slate-100">
        Estimated impact: +{conversionInsight.estimatedLiftLow}-{conversionInsight.estimatedLiftHigh}%
      </p>
      <p className="mt-3 text-sm text-slate-300">
        <span className="font-semibold text-slate-100">Recommended action: </span>
        {conversionInsight.recommendedAction}
      </p>

      <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
        <span>
          Inputs: {conversionInsight.fromState} -&gt; {conversionInsight.toState} | {conversionInsight.transitionCount} -&gt; {conversionInsight.nextStepCount}
        </span>
        <a href="#supporting-data" className="font-semibold text-slate-200 hover:text-slate-100">
          View details
        </a>
      </div>
    </article>
  );
}
