type LoopInsight = {
  type: "two-state" | "self";
  states: string[];
  totalCount: number;
};

type LoopInsightCardProps = {
  topLoop: LoopInsight | null;
  error: string | null;
  totalTransitions: number;
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

export function LoopInsightCard({ topLoop, error, totalTransitions }: LoopInsightCardProps) {
  if (error) {
    return (
      <article className="insights-feed-card insights-feed-card--loop animate-rise p-6 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.04em] text-violet-200">
            Users are stuck in this loop
          </p>
          <span className="rounded-full border border-violet-300/40 bg-violet-500/20 px-2 py-0.5 text-[11px] font-semibold text-violet-100">
            Medium Impact
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
          <p className="text-xs font-semibold tracking-[0.04em] text-violet-200">
            Users are stuck in this loop
          </p>
          <span className="rounded-full border border-violet-300/40 bg-violet-500/20 px-2 py-0.5 text-[11px] font-semibold text-violet-100">
            Medium Impact
          </span>
        </div>
        <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-100">
          No recurring loop detected
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Journeys are moving forward without obvious repeated loops right now.
        </p>
      </article>
    );
  }

  const loopShare = totalTransitions > 0 ? (topLoop.totalCount / totalTransitions) * 100 : 0;

  return (
    <article className="insights-feed-card insights-feed-card--loop animate-rise p-6 md:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.04em] text-violet-200">
          Users are stuck in this loop
        </p>
        <span className="rounded-full border border-violet-300/40 bg-violet-500/20 px-2 py-0.5 text-[11px] font-semibold text-violet-100">
          Medium Impact
        </span>
      </div>
      <p className="mt-3 text-balance text-2xl leading-tight font-bold tracking-tight text-violet-100 md:text-[2rem]">
        {formatLoopLabel(topLoop)}
      </p>
      <p className="mt-2 text-lg font-semibold text-violet-200">
        {loopShare.toFixed(1)}% of users repeat this cycle before moving on
      </p>
      <p className="mt-4 text-sm leading-6 text-slate-300">
        People are bouncing between these steps instead of deciding. Clarify choices and reduce uncertainty between these pages.
      </p>
      <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
        <span>Affected users: {topLoop.totalCount.toLocaleString()}</span>
        <a href="#supporting-data" className="font-semibold text-violet-200 hover:text-violet-100">
          View details
        </a>
      </div>
    </article>
  );
}
