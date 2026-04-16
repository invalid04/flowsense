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
};

function toReadableStateLabel(state: string): string {
  const segments = state.split("/").filter(Boolean);
  const leaf = segments.length > 0 ? segments[segments.length - 1] : state;

  return leaf.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DropoffInsightCard({
  biggestDropoff,
  totalTransitions,
}: DropoffInsightCardProps) {
  if (!biggestDropoff) {
    return (
      <article className="insights-feed-card insights-feed-card--dropoff animate-rise p-6 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.04em] text-orange-200">
            Users are dropping off here
          </p>
          <span className="rounded-full border border-orange-300/40 bg-orange-500/20 px-2 py-0.5 text-[11px] font-semibold text-orange-100">
            High Impact
          </span>
        </div>
        <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-100">
          No major exit point detected yet
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          More event data is needed before FlowSense can isolate a high-friction handoff.
        </p>
      </article>
    );
  }

  const fromLabel = biggestDropoff.leadingFromState
    ? toReadableStateLabel(biggestDropoff.leadingFromState)
    : null;
  const toLabel = toReadableStateLabel(biggestDropoff.stateName);
  const transitionLabel = fromLabel ? `${fromLabel} -> ${toLabel}` : toLabel;

  const shareOfModel =
    totalTransitions > 0 ? (biggestDropoff.incomingCount / totalTransitions) * 100 : 0;

  return (
    <article className="insights-feed-card insights-feed-card--dropoff animate-rise p-6 md:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.04em] text-orange-200">
          Users are dropping off here
        </p>
        <span className="rounded-full border border-orange-300/40 bg-orange-500/20 px-2 py-0.5 text-[11px] font-semibold text-orange-100">
          High Impact
        </span>
      </div>
      <p className="mt-3 text-balance text-2xl leading-tight font-bold tracking-tight text-orange-100 md:text-[2rem]">
        {transitionLabel}
      </p>
      <p className="mt-2 text-lg font-semibold text-orange-200">
        {shareOfModel.toFixed(1)}% of users drop off here
      </p>
      <p className="mt-4 text-sm leading-6 text-slate-300">
        Users are leaving at this step. This usually points to checkout friction, unclear fields, or trust concerns.
      </p>
      <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
        <span>Affected users: {biggestDropoff.incomingCount.toLocaleString()}</span>
        <a href="#supporting-data" className="font-semibold text-orange-200 hover:text-orange-100">
          View details
        </a>
      </div>
    </article>
  );
}
