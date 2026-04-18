import { PredictionPanel } from "./PredictionPanel";
import { UploadForm } from "./UploadForm";
import { StateTransitionsChart } from "./StateTransitionsChart";
import { DropoffInsightCard } from "./DropoffInsightCard";
import { ConversionPathInsightCard } from "./ConversionPathInsightCard";
import { LoopInsightCard } from "./LoopInsightCard";
import { AutoSummaryCard } from "./AutoSummaryCard";
import { TrackForm } from "./TrackForm";
import { SampleDatasetLoader } from "./SampleDatasetLoader";
import { db } from "@/db";
import {
  sessions as sessionsTable,
  states as statesTable,
  transitions as transitionsTable,
} from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getOrCreateAccount } from "@/lib/getOrCreateAccount";
import { resolveConversionStatesForAccount } from "@/lib/resolveConversionStatesForAccount";

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

type ConversionPathResult = {
  insight: ConversionPathInsight | null;
  error: string | null;
};

type LoopInsight = {
  type: "two-state" | "self";
  states: string[];
  totalCount: number;
};

type LoopInsightResult = {
  topLoop: LoopInsight | null;
  error: string | null;
};

type DropoffInsight = {
  stateId: string;
  stateName: string;
  incomingCount: number;
  outgoingCount: number;
  leadingFromState: string | null;
  leadingEdgeCount: number;
};

const MAX_STEPS = 10;

async function getAnalytics(accountId: string): Promise<{ transitions: Transition[] }> {
  const fromStates = alias(statesTable, "from_states");
  const toStates = alias(statesTable, "to_states");

  const rows = await db
    .select({
      fromState: fromStates.name,
      toState: toStates.name,
      count: sql<number>`sum(${transitionsTable.count})`,
    })
    .from(transitionsTable)
    .innerJoin(fromStates, eq(transitionsTable.fromStateId, fromStates.id))
    .innerJoin(toStates, eq(transitionsTable.toStateId, toStates.id))
    .where(eq(transitionsTable.accountId, accountId))
    .groupBy(fromStates.name, toStates.name);

  const totalsByFromState = new Map<string, number>();

  for (const row of rows) {
    totalsByFromState.set(
      row.fromState,
      (totalsByFromState.get(row.fromState) ?? 0) + Number(row.count)
    );
  }

  const analytics = rows.map((row) => {
    const count = Number(row.count);
    const totalFromThisState = totalsByFromState.get(row.fromState) ?? 0;
    const probability = totalFromThisState > 0 ? count / totalFromThisState : 0;

    return {
      fromState: row.fromState,
      toState: row.toState,
      count,
      probability,
    };
  });

  return {
    transitions: analytics,
  };
}

async function getDropoffInsight(accountId: string) {
  const incomingRows = await db
    .select({
      stateId: transitionsTable.toStateId,
      stateName: statesTable.name,
      incomingCount: sql<number>`sum(${transitionsTable.count})`,
    })
    .from(transitionsTable)
    .innerJoin(statesTable, eq(transitionsTable.toStateId, statesTable.id))
    .where(eq(transitionsTable.accountId, accountId))
    .groupBy(transitionsTable.toStateId, statesTable.name);

  const outgoingRows = await db
    .select({
      stateId: transitionsTable.fromStateId,
      outgoingCount: sql<number>`sum(${transitionsTable.count})`,
    })
    .from(transitionsTable)
    .where(eq(transitionsTable.accountId, accountId))
    .groupBy(transitionsTable.fromStateId);

  const fromStates = alias(statesTable, "dropoff_from_states");
  const incomingEdgeRows = await db
    .select({
      toStateId: transitionsTable.toStateId,
      fromStateName: fromStates.name,
      edgeCount: sql<number>`sum(${transitionsTable.count})`,
    })
    .from(transitionsTable)
    .innerJoin(fromStates, eq(transitionsTable.fromStateId, fromStates.id))
    .where(eq(transitionsTable.accountId, accountId))
    .groupBy(transitionsTable.toStateId, fromStates.name)
    .orderBy(desc(sql<number>`sum(${transitionsTable.count})`));

  const outgoingMap = new Map<string, number>();
  for (const row of outgoingRows) {
    outgoingMap.set(row.stateId, Number(row.outgoingCount));
  }

  const leadingEdgeByStateId = new Map<string, { fromStateName: string; edgeCount: number }>();
  for (const row of incomingEdgeRows) {
    if (!leadingEdgeByStateId.has(row.toStateId)) {
      leadingEdgeByStateId.set(row.toStateId, {
        fromStateName: row.fromStateName,
        edgeCount: Number(row.edgeCount),
      });
    }
  }

  const dropoffCandidates: DropoffInsight[] = incomingRows
    .map((row) => {
      const leadingEdge = leadingEdgeByStateId.get(row.stateId);
      return {
        stateId: row.stateId,
        stateName: row.stateName,
        incomingCount: Number(row.incomingCount),
        outgoingCount: outgoingMap.get(row.stateId) ?? 0,
        leadingFromState: leadingEdge?.fromStateName ?? null,
        leadingEdgeCount: leadingEdge?.edgeCount ?? 0,
      };
    })
    .filter((row) => row.outgoingCount === 0)
    .sort((a, b) => b.incomingCount - a.incomingCount);

  return {
    biggestDropoff: dropoffCandidates[0] ?? null,
    candidates: dropoffCandidates,
  };
}

async function getConversionPathInsight(accountId: string): Promise<ConversionPathResult> {
  const startStateParam = "/home";
  const conversionStates = new Set(await resolveConversionStatesForAccount({ accountId }));

  try {
    const startState = await db.query.states.findFirst({
      where: eq(statesTable.name, startStateParam),
    });

    if (!startState) {
      return {
        insight: null,
        error: "Start state not found",
      };
    }

    const path = [startState.name];
    const visited = new Set<string>([startState.name]);
    let currentStateId = startState.id;
    let currentStateName = startState.name;
    let endedReason: ConversionEndedReason = "max_steps_reached";

    for (let step = 0; step < MAX_STEPS; step++) {
      if (step > 0 && conversionStates.has(currentStateName)) {
        endedReason = "reached_conversion_state";
        break;
      }

      const outgoingRows = await db
        .select({
          toStateId: transitionsTable.toStateId,
          toStateName: statesTable.name,
          count: sql<number>`sum(${transitionsTable.count})`,
        })
        .from(transitionsTable)
        .innerJoin(statesTable, eq(transitionsTable.toStateId, statesTable.id))
        .where(
          and(
            eq(transitionsTable.fromStateId, currentStateId),
            eq(transitionsTable.accountId, accountId)
          )
        )
        .groupBy(transitionsTable.toStateId, statesTable.name)
        .orderBy(desc(sql<number>`sum(${transitionsTable.count})`));

      if (outgoingRows.length === 0) {
        endedReason = "no_outgoing_transitions";
        break;
      }

      const next = outgoingRows[0];
      const nextStateName = next.toStateName;
      const nextStateId = next.toStateId;

      if (visited.has(nextStateName)) {
        endedReason = "loop_detected";
        break;
      }

      path.push(nextStateName);
      visited.add(nextStateName);
      currentStateId = nextStateId;
      currentStateName = nextStateName;

      if (conversionStates.has(currentStateName)) {
        endedReason = "reached_conversion_state";
        break;
      }
    }

    return {
      insight: {
        startState: startState.name,
        conversionStates: Array.from(conversionStates),
        path,
        endedReason,
      },
      error: null,
    };
  } catch {
    return {
      insight: null,
      error: "Failed to fetch conversion path insight",
    };
  }
}

async function getLoopInsight(accountId: string): Promise<LoopInsightResult> {
  try {
    const allStates = await db.select().from(statesTable);
    const stateNameById = new Map<string, string>();

    for (const state of allStates) {
      stateNameById.set(state.id, state.name);
    }

    const allTransitions = await db
      .select()
      .from(transitionsTable)
      .where(eq(transitionsTable.accountId, accountId));

    const transitionCountMap = new Map<string, number>();

    for (const transition of allTransitions) {
      const key = `${transition.fromStateId}->${transition.toStateId}`;
      transitionCountMap.set(key, Number(transition.count));
    }

    const loops: LoopInsight[] = [];
    const visitedPairs = new Set<string>();

    for (const transition of allTransitions) {
      const fromId = transition.fromStateId;
      const toId = transition.toStateId;

      if (fromId === toId) {
        const stateName = stateNameById.get(fromId);
        if (!stateName) continue;

        loops.push({
          type: "self",
          states: [stateName],
          totalCount: Number(transition.count),
        });
        continue;
      }

      const forwardKey = `${fromId}->${toId}`;
      const reverseKey = `${toId}->${fromId}`;

      if (!transitionCountMap.has(reverseKey)) {
        continue;
      }

      const pairKey = [fromId, toId].sort().join("<->");
      if (visitedPairs.has(pairKey)) {
        continue;
      }
      visitedPairs.add(pairKey);

      const fromStateName = stateNameById.get(fromId);
      const toStateName = stateNameById.get(toId);

      if (!fromStateName || !toStateName) {
        continue;
      }

      const forwardCount = transitionCountMap.get(forwardKey) ?? 0;
      const reverseCount = transitionCountMap.get(reverseKey) ?? 0;

      loops.push({
        type: "two-state",
        states: [fromStateName, toStateName],
        totalCount: forwardCount + reverseCount,
      });
    }

    loops.sort((a, b) => b.totalCount - a.totalCount);

    return {
      topLoop: loops[0] ?? null,
      error: null,
    };
  } catch {
    return {
      topLoop: null,
      error: "Failed to fetch loop insight",
    };
  }
}

type Transition = {
  fromState: string;
  toState: string;
  count: number;
  probability: number;
};

type DatasetStatus = {
  sessions: number;
  rows: number;
  lastUpdatedAt: Date | string | null;
};

function toReadableStateLabel(state: string): string {
  const segments = state.split("/").filter(Boolean);
  const leaf = segments.length > 0 ? segments[segments.length - 1] : state;
  return leaf.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getImpactLevel(score: number): ImpactLevel {
  if (score >= 55) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function getFunnelPositionScore(stepName: string | null): number {
  if (!stepName) return 8;
  const key = stepName.toLowerCase();

  if (key.includes("checkout") || key.includes("payment") || key.includes("purchase")) return 24;
  if (key.includes("pricing") || key.includes("signup") || key.includes("cart")) return 18;
  if (key.includes("product") || key.includes("plan")) return 12;

  return 8;
}

async function getDatasetStatus(accountId: string): Promise<DatasetStatus> {
  const [sessionTotals, rowTotals, lastUpdated] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)` })
      .from(sessionsTable)
      .where(eq(sessionsTable.accountId, accountId)),
    db
      .select({ value: sql<number>`count(*)` })
      .from(transitionsTable)
      .where(eq(transitionsTable.accountId, accountId)),
    db
      .select({ value: sql<Date | null>`max(${transitionsTable.createdAt})` })
      .from(transitionsTable)
      .where(eq(transitionsTable.accountId, accountId)),
  ]);

  return {
    sessions: Number(sessionTotals[0]?.value ?? 0),
    rows: Number(rowTotals[0]?.value ?? 0),
    lastUpdatedAt: lastUpdated[0]?.value ?? null,
  };
}

export default async function HomePage() {
  const account = await getOrCreateAccount();
  const [data, dropoffData, conversionPathResult, loopInsightResult, datasetStatus] =
    await Promise.all([
      getAnalytics(account.id),
      getDropoffInsight(account.id),
      getConversionPathInsight(account.id),
      getLoopInsight(account.id),
      getDatasetStatus(account.id),
    ]);

  const transitions: Transition[] = data.transitions ?? [];
  const biggestDropoff = dropoffData.biggestDropoff ?? null;
  const { insight: conversionPathInsight, error: conversionPathError } = conversionPathResult;
  const { topLoop, error: loopInsightError } = loopInsightResult;

  const totalTransitions = transitions.reduce((sum, item) => sum + item.count, 0);
  const uniqueStates = new Set(
    transitions.flatMap((item) => [item.fromState, item.toState])
  ).size;

  const topTransition = transitions.reduce<Transition | null>((top, current) => {
    if (!top || current.count > top.count) return current;
    return top;
  }, null);

  const parsedLastUpdatedAt =
    datasetStatus.lastUpdatedAt instanceof Date
      ? datasetStatus.lastUpdatedAt
      : datasetStatus.lastUpdatedAt
        ? new Date(datasetStatus.lastUpdatedAt)
        : null;

  const hasValidLastUpdatedAt =
    parsedLastUpdatedAt !== null && !Number.isNaN(parsedLastUpdatedAt.getTime());

  const lastUpdatedLabel = hasValidLastUpdatedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(parsedLastUpdatedAt)
    : "No events yet";

  const dropoffStepLabel = biggestDropoff ? toReadableStateLabel(biggestDropoff.stateName) : null;
  const loopStatesLabel =
    topLoop && topLoop.states.length > 1
      ? `${toReadableStateLabel(topLoop.states[0])} and ${toReadableStateLabel(topLoop.states[1])}`
      : topLoop
        ? toReadableStateLabel(topLoop.states[0])
        : null;

  const dropoffShare =
    biggestDropoff && totalTransitions > 0 ? (biggestDropoff.incomingCount / totalTransitions) * 100 : 0;
  const dropoffScore = biggestDropoff
    ? dropoffShare * 1.2 + getFunnelPositionScore(biggestDropoff.stateName)
    : 0;
  const dropoffImpactLevel = getImpactLevel(dropoffScore);

  const loopShare = topLoop && totalTransitions > 0 ? (topLoop.totalCount / totalTransitions) * 100 : 0;
  const loopScore = topLoop ? loopShare * 1.1 + Math.min(20, topLoop.totalCount / 15) : 0;
  const loopImpactLevel = getImpactLevel(loopScore);

  const pathDepth = conversionPathInsight?.path.length ?? 0;
  const conversionPathScore = conversionPathInsight
    ? (conversionPathInsight.endedReason === "reached_conversion_state" ? 36 : 24) +
      Math.min(20, pathDepth * 3)
    : 0;
  const conversionPathImpactLevel = getImpactLevel(conversionPathScore);

  const priorityActions = [
    {
      title: "Fix checkout abandonment first",
      impact: dropoffImpactLevel,
      score: dropoffScore,
      detail: dropoffStepLabel
        ? `${dropoffShare.toFixed(1)}% of modeled traffic exits at ${dropoffStepLabel}.`
        : "Collect more transition data to confirm your primary exit point.",
      action: dropoffStepLabel
        ? `Shorten the ${dropoffStepLabel.toLowerCase()} step and remove non-essential friction.`
        : "Increase tracked sessions and re-check drop-off hotspots.",
    },
    {
      title: "Reduce hesitation loops",
      impact: loopImpactLevel,
      score: loopScore,
      detail: loopStatesLabel
        ? `${loopShare.toFixed(1)}% of transitions loop between ${loopStatesLabel}.`
        : "No significant loop is currently detected.",
      action: loopStatesLabel
        ? `Clarify the difference between ${loopStatesLabel} and tighten CTAs.`
        : "Monitor new feature rollouts for emerging loop behavior.",
    },
    {
      title: "Scale your best conversion path",
      impact: conversionPathImpactLevel,
      score: conversionPathScore,
      detail: conversionPathInsight
        ? `Winning path currently has ${conversionPathInsight.path.length} steps from entry to conversion.`
        : "Top conversion path is not stable yet.",
      action: conversionPathInsight
        ? "Drive more users into this path with stronger in-product entry points."
        : "Route more traffic through one core onboarding path to build signal.",
    },
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full space-y-8">
      <AutoSummaryCard />
      <SampleDatasetLoader />

      <section className="insights-surface animate-rise rounded-3xl p-6 md:p-8" style={{ animationDelay: "40ms" }}>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.16em] text-slate-300 uppercase">FlowSense</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-50 md:text-5xl">Growth Opportunities</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-200 md:text-base">
              Understand where users drop off and get clear actions to increase conversions.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-950/45 px-4 py-3">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-300 uppercase">Active Dataset</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">
              Rows: {datasetStatus.rows.toLocaleString()} | Sessions: {datasetStatus.sessions.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-300">Updated {lastUpdatedLabel}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-rose-300 uppercase">Section 1</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-100">What to Fix First</h2>
          <p className="mt-1 text-sm text-slate-300">Priority-ranked actions based on impact score.</p>
        </div>

        <article className="insights-feed-card animate-rise p-6 md:p-7" style={{ animationDelay: "100ms" }}>
          <ul className="space-y-4 text-sm">
            {priorityActions.map((action, index) => (
              <li key={action.title} className="rounded-xl border border-slate-700/80 bg-black/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-semibold text-slate-100">
                    {index + 1}. {action.title}
                  </p>
                  <span className="rounded-full border border-slate-500/60 bg-slate-500/15 px-2 py-0.5 text-[11px] font-semibold text-slate-200 uppercase">
                    {action.impact} impact
                  </span>
                </div>
                <p className="mt-2 text-slate-200">{action.detail}</p>
                <p className="mt-1 text-slate-300">Action: {action.action}</p>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-slate-600 pt-4 text-xs text-slate-300">
            Impact score inputs: drop-off %, traffic volume, and funnel position.
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-slate-300 uppercase">Section 2</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Insights Feed</h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DropoffInsightCard
            biggestDropoff={biggestDropoff}
            totalTransitions={totalTransitions}
            impactLevel={dropoffImpactLevel}
          />
          <LoopInsightCard
            topLoop={topLoop}
            error={loopInsightError}
            totalTransitions={totalTransitions}
            impactLevel={loopImpactLevel}
          />
          <ConversionPathInsightCard
            insight={conversionPathInsight}
            error={conversionPathError}
            impactLevel={conversionPathImpactLevel}
          />
        </div>
      </section>

      <section id="supporting-data" className="mt-14 space-y-4 opacity-85">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">Section 3</p>
          <h2 className="text-xl font-medium tracking-tight text-slate-300">Supporting Data</h2>
          <p className="mt-1 text-sm text-slate-400">Raw transition data backing each recommendation.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="animate-rise" style={{ animationDelay: "180ms" }}>
            <StateTransitionsChart />
          </div>
          <div className="insights-surface animate-rise rounded-2xl p-5 md:p-6" style={{ animationDelay: "210ms" }}>
            <p className="text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">Behavior Engine Snapshot</p>
            <p className="mt-3 text-sm text-slate-300">
              {topTransition
                ? `Highest-volume edge: ${topTransition.fromState} -> ${topTransition.toState} (${topTransition.count.toLocaleString()} transitions)`
                : "No transitions loaded yet."}
            </p>
            <p className="mt-2 text-sm text-slate-300">Unique states: {uniqueStates.toLocaleString()}</p>
            <p className="mt-2 text-sm text-slate-300">Total transitions: {totalTransitions.toLocaleString()}</p>
          </div>
        </div>

        <div className="insights-surface animate-rise overflow-hidden rounded-2xl" style={{ animationDelay: "240ms" }}>
          <div className="border-b border-slate-700/80 px-5 py-4 md:px-6">
            <h3 className="text-sm font-semibold text-slate-300">Transition Table</h3>
            <p className="text-sm text-slate-400">Detailed edges powering your current recommendations.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-950/35">
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-300 uppercase md:px-6">From State</th>
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-300 uppercase md:px-6">To State</th>
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-300 uppercase md:px-6">Count</th>
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-300 uppercase md:px-6">Probability</th>
                </tr>
              </thead>
              <tbody>
                {transitions.length > 0 ? (
                  transitions.map((transition, index) => (
                    <tr
                      key={`${transition.fromState}-${transition.toState}-${index}`}
                      className="border-b border-slate-800/70 text-slate-200 last:border-b-0"
                    >
                      <td className="px-5 py-3 font-mono text-sm md:px-6">{transition.fromState}</td>
                      <td className="px-5 py-3 font-mono text-sm md:px-6">{transition.toState}</td>
                      <td className="px-5 py-3 md:px-6">{transition.count}</td>
                      <td className="px-5 py-3 font-semibold text-cyan-300 md:px-6">
                        {(transition.probability * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-8 text-sm text-slate-300 md:px-6" colSpan={4}>
                      No transition data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-slate-300 uppercase">Section 4</p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Deep Dive</h2>
          <p className="mt-1 text-sm text-slate-200">Optional controls for advanced analysis and data operations.</p>
        </div>

        <details className="insights-surface rounded-2xl p-5 md:p-6">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-200">
            Expand advanced tools
          </summary>
          <p className="mt-2 text-sm text-slate-200">
            Use these tools when you need to validate a hypothesis or refresh model data.
          </p>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <PredictionPanel />
            <UploadForm />
          </div>
          <div className="mt-4">
            <TrackForm />
          </div>
        </details>
      </section>
    </div>
  );
}
