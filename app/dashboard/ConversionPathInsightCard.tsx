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
};

type ConversionPathInsightCardProps = {
  insight: ConversionPathInsight | null;
  error: string | null;
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

export function ConversionPathInsightCard({ insight, error, impactLevel }: ConversionPathInsightCardProps) {
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
    return (
      <article className={`insights-feed-card insights-card-indicator animate-rise p-6 md:p-7 ${cardClass}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-300 uppercase">Decision Signal</p>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${impact.className}`}>
            {impact.icon} {impact.label}
          </span>
        </div>
        <p className={`mt-3 text-balance leading-tight tracking-tight md:text-[2rem] ${headlineClass}`}>
          No winning path confirmed yet
        </p>
        <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Metric</p>
        <p className="mt-1 text-sm text-slate-200">Not enough behavioral evidence to confirm the top converting journey.</p>
        <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Likely Cause</p>
        <p className="mt-1 text-sm text-slate-300">Dataset is still early or conversions are not yet concentrated.</p>
        <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Suggested Fix</p>
        <p className="mt-1 text-sm text-slate-300">Keep tracking and guide traffic through your primary conversion CTA.</p>
      </article>
    );
  }

  const readablePath = insight.path.map(toReadableStateLabel).join(" -> ");
  const pathStatusCopy: Record<ConversionEndedReason, string> = {
    reached_conversion_state: "Users on this path are most likely to convert.",
    no_outgoing_transitions: "Users stall before the final conversion step.",
    loop_detected: "Users almost convert, but hesitation interrupts the path.",
    max_steps_reached: "Path is promising but still needs stronger completion momentum.",
  };

  return (
    <article className={`insights-feed-card insights-card-indicator animate-rise p-6 md:p-7 ${cardClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.12em] text-slate-300 uppercase">Decision Signal</p>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${impact.className}`}>
          {impact.icon} {impact.label}
        </span>
      </div>
      <p className={`mt-3 text-balance leading-tight tracking-tight md:text-[2rem] ${headlineClass}`}>
        You have one path that outperforms the rest
      </p>
      <p className="mt-2 text-sm text-slate-200">Winning path: {readablePath}</p>

      <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Metric</p>
      <p className="mt-1 text-sm text-slate-200">{pathStatusCopy[insight.endedReason]}</p>

      <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Likely Cause</p>
      <p className="mt-1 text-sm text-slate-300">This sequence reduces uncertainty better than alternative routes.</p>

      <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Suggested Fix</p>
      <p className="mt-1 text-sm text-slate-300">
        Promote this flow earlier in onboarding and link to it more aggressively from high-traffic entry points.
      </p>

      <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
        <span>Starts at: {toReadableStateLabel(insight.startState)}</span>
        <a href="#supporting-data" className="font-semibold text-slate-200 hover:text-slate-100">
          View details
        </a>
      </div>
    </article>
  );
}
