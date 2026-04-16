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

function toReadableStateLabel(state: string): string {
  const segments = state.split("/").filter(Boolean);
  const leaf = segments.length > 0 ? segments[segments.length - 1] : state;
  return leaf.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ConversionPathInsightCard({
  insight,
  error,
}: ConversionPathInsightCardProps) {
  if (error) {
    return (
      <article className="insights-feed-card insights-feed-card--success animate-rise p-6 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.04em] text-emerald-200">
            This is your strongest conversion path
          </p>
          <span className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
            Medium Impact
          </span>
        </div>
        <p className="mt-4 text-sm text-rose-300">{error}</p>
      </article>
    );
  }

  if (!insight) {
    return (
      <article className="insights-feed-card insights-feed-card--success animate-rise p-6 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.04em] text-emerald-200">
            This is your strongest conversion path
          </p>
          <span className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
            Medium Impact
          </span>
        </div>
        <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-100">
          No conversion path available yet
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Load additional sessions so FlowSense can identify a reliable success journey.
        </p>
      </article>
    );
  }

  const readablePath = insight.path.map(toReadableStateLabel).join(" -> ");
  const pathStatusCopy: Record<ConversionEndedReason, string> = {
    reached_conversion_state: "Most users who convert follow this path",
    no_outgoing_transitions: "This path performs best, but many users stop before converting",
    loop_detected: "This path performs best, but users still loop before converting",
    max_steps_reached: "This path is strongest so far and needs more data to confirm completion",
  };

  return (
    <article className="insights-feed-card insights-feed-card--success animate-rise p-6 md:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.04em] text-emerald-200">
          This is your strongest conversion path
        </p>
        <span className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
          Medium Impact
        </span>
      </div>
      <p className="mt-3 text-balance text-2xl leading-tight font-bold tracking-tight text-emerald-100 md:text-[2rem]">
        {readablePath}
      </p>
      <p className="mt-2 text-lg font-semibold text-emerald-200">
        {pathStatusCopy[insight.endedReason]}
      </p>
      <p className="mt-4 text-sm leading-6 text-slate-300">
        Make this journey easier to start and faster to complete. It is the clearest path to conversion in your current data.
      </p>
      <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
        <span>Starts at: {toReadableStateLabel(insight.startState)}</span>
        <a href="#supporting-data" className="font-semibold text-emerald-200 hover:text-emerald-100">
          View details
        </a>
      </div>
    </article>
  );
}
