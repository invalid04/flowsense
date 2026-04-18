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
    return { label: "High Impact", icon: "??", className: "border-red-300/50 bg-red-500/20 text-red-100" };
  }
  if (impactLevel === "medium") {
    return { label: "Medium Impact", icon: "??", className: "border-amber-300/50 bg-amber-500/20 text-amber-100" };
  }
  return { label: "Low Impact", icon: "??", className: "border-emerald-300/50 bg-emerald-500/20 text-emerald-100" };
}

export function LoopInsightCard({ topLoop, error, totalTransitions, impactLevel }: LoopInsightCardProps) {
  const impact = impactBadge(impactLevel);

  if (error) {
    return (
      <article className="insights-feed-card insights-feed-card--loop animate-rise p-6 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.04em] text-violet-200">Problem</p>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${impact.className}`}>
            {impact.icon} {impact.label}
          </span>
        </div>
        <p className="mt-4 text-sm text-rose-300">{error}</p>
      </article>
    );
  }

  if (!topLoop) {
    return (
      <article className="insights-feed-card insights-feed-card--loop animate-rise p-6 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.04em] text-violet-200">Problem</p>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${impact.className}`}>
            {impact.icon} {impact.label}
          </span>
        </div>
        <p className="mt-3 text-balance text-2xl leading-tight font-bold tracking-tight text-violet-100 md:text-[2rem]">
          No major hesitation loop detected
        </p>
        <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Metric</p>
        <p className="mt-1 text-sm text-slate-200">Users are progressing without repeat loops in current data.</p>
        <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Likely Cause</p>
        <p className="mt-1 text-sm text-slate-300">Decision points are clear enough for forward movement.</p>
        <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Suggested Fix</p>
        <p className="mt-1 text-sm text-slate-300">Keep key choices explicit as you add new pages and pricing options.</p>
      </article>
    );
  }

  const loopShare = totalTransitions > 0 ? (topLoop.totalCount / totalTransitions) * 100 : 0;

  return (
    <article className="insights-feed-card insights-feed-card--loop animate-rise p-6 md:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.04em] text-violet-200">Problem</p>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${impact.className}`}>
          {impact.icon} {impact.label}
        </span>
      </div>
      <p className="mt-3 text-balance text-2xl leading-tight font-bold tracking-tight text-violet-100 md:text-[2rem]">
        Users are getting stuck deciding
      </p>
      <p className="mt-2 text-sm text-slate-200">Loop detected: {formatLoopLabel(topLoop)}</p>

      <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Metric</p>
      <p className="mt-1 text-sm text-slate-200">
        {loopShare.toFixed(1)}% of transitions repeat this cycle ({topLoop.totalCount.toLocaleString()} loop events).
      </p>

      <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Likely Cause</p>
      <p className="mt-1 text-sm text-slate-300">Positioning between these steps is ambiguous, so users keep bouncing back.</p>

      <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Suggested Fix</p>
      <p className="mt-1 text-sm text-slate-300">
        Differentiate these screens with clearer CTA hierarchy and explicit next-action messaging.
      </p>

      <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
        <span>Impact driver: repeat behavior at meaningful volume</span>
        <a href="#supporting-data" className="font-semibold text-violet-200 hover:text-violet-100">
          View details
        </a>
      </div>
    </article>
  );
}
