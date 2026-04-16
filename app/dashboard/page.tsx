import { PredictionPanel } from "./PredictionPanel";
import { UploadForm } from "./UploadForm";
import { StateTransitionsChart } from "./StateTransitionsChart";
import { DropoffInsightCard } from "./DropoffInsightCard";
import { ConversionPathInsightCard } from "./ConversionPathInsightCard";
import { LoopInsightCard } from "./LoopInsightCard";
import { db } from "@/db";
import {
  sessions as sessionsTable,
  states as statesTable,
  transitions as transitionsTable,
} from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getOrCreateAccount } from "@/lib/getOrCreateAccount";

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

const DEFAULT_CONVERSION_STATES = [
  "/confirmation",
  "/checkout",
  "/signup",
  "/contact-sales",
];

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

  const outgoingMap = new Map<string, number>();

  for (const row of outgoingRows) {
    outgoingMap.set(row.stateId, Number(row.outgoingCount));
  }

  const dropoffCandidates = incomingRows
    .map((row) => ({
      stateId: row.stateId,
      stateName: row.stateName,
      incomingCount: Number(row.incomingCount),
      outgoingCount: outgoingMap.get(row.stateId) ?? 0,
    }))
    .filter((row) => row.outgoingCount === 0)
    .sort((a, b) => b.incomingCount - a.incomingCount);

  return {
    biggestDropoff: dropoffCandidates[0] ?? null,
    candidates: dropoffCandidates,
  };
}

async function getConversionPathInsight(accountId: string): Promise<ConversionPathResult> {
  const startStateParam = "/home";
  const conversionStates = new Set(DEFAULT_CONVERSION_STATES);

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
  const dropoffCandidates = dropoffData.candidates ?? [];
  const { insight: conversionPathInsight, error: conversionPathError } =
    conversionPathResult;
  const { topLoop, error: loopInsightError } = loopInsightResult;
  const totalTransitions = transitions.reduce((sum, item) => sum + item.count, 0);
  const uniqueStates = new Set(
    transitions.flatMap((item) => [item.fromState, item.toState])
  ).size;
  const topPath = transitions.reduce<Transition | null>((top, current) => {
    if (!top || current.probability > top.probability) return current;
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

  return (
    <main className="enterprise-grid min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[96rem] space-y-6">
        <section
          className="glass-panel animate-rise overflow-hidden rounded-3xl p-6 md:p-8"
          style={{ animationDelay: "40ms" }}
        >
          <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
                ENTERPRISE ANALYTICS
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                FlowSense Intelligence Console
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                Behavioral Prediction Engine
              </p>
            </div>
            <div className="self-start rounded-2xl border border-[var(--panel-border)] bg-white/70 px-4 py-3">
              <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
                Active Dataset
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                Rows: {datasetStatus.rows.toLocaleString()} | Sessions:{" "}
                {datasetStatus.sessions.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">Updated {lastUpdatedLabel}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="badge-kpi rounded-2xl p-4">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                States Mapped
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{uniqueStates}</p>
            </div>
            <div className="badge-kpi rounded-2xl p-4">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Transition Volume
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalTransitions.toLocaleString()}
              </p>
            </div>
            <div className="badge-kpi rounded-2xl p-4">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Top Predicted Path
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-800 md:text-base">
                {topPath
                  ? `${topPath.fromState} -> ${topPath.toState} (${(
                      topPath.probability * 100
                    ).toFixed(1)}%)`
                  : "No transitions yet"}
              </p>
            </div>
            <div className="badge-kpi rounded-2xl p-4">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Active Sessions
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {datasetStatus.sessions.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="animate-rise" style={{ animationDelay: "120ms" }}>
            <ConversionPathInsightCard
              insight={conversionPathInsight}
              error={conversionPathError}
            />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="animate-rise" style={{ animationDelay: "200ms" }}>
            <PredictionPanel />
          </div>
          <div className="animate-rise" style={{ animationDelay: "220ms" }}>
            <DropoffInsightCard
              biggestDropoff={biggestDropoff}
              candidateCount={dropoffCandidates.length}
            />
          </div>
          <div className="animate-rise" style={{ animationDelay: "240ms" }}>
            <LoopInsightCard topLoop={topLoop} error={loopInsightError} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="animate-rise" style={{ animationDelay: "260ms" }}>
            <StateTransitionsChart />
          </div>
          <div
            className="glass-panel animate-rise overflow-hidden rounded-3xl"
            style={{ animationDelay: "280ms" }}
          >
            <div className="border-b border-[var(--panel-border)] px-5 py-4 md:px-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Transition Registry
              </h2>
              <p className="text-sm text-slate-500">
                Latest calculated edges from your loaded sessions
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--panel-border)] bg-slate-50/70">
                    <th className="px-5 py-3 text-xs tracking-wide text-slate-600 uppercase md:px-6">
                      From State
                    </th>
                    <th className="px-5 py-3 text-xs tracking-wide text-slate-600 uppercase md:px-6">
                      To State
                    </th>
                    <th className="px-5 py-3 text-xs tracking-wide text-slate-600 uppercase md:px-6">
                      Count
                    </th>
                    <th className="px-5 py-3 text-xs tracking-wide text-slate-600 uppercase md:px-6">
                      Probability
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transitions.length > 0 ? (
                    transitions.map((transition, index) => (
                      <tr
                        key={`${transition.fromState}-${transition.toState}-${index}`}
                        className="border-b border-[var(--panel-border)]/70 last:border-b-0"
                      >
                        <td className="px-5 py-3 font-mono text-sm md:px-6">
                          {transition.fromState}
                        </td>
                        <td className="px-5 py-3 font-mono text-sm md:px-6">
                          {transition.toState}
                        </td>
                        <td className="px-5 py-3 md:px-6">{transition.count}</td>
                        <td className="px-5 py-3 font-semibold text-[var(--accent)] md:px-6">
                          {(transition.probability * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-5 py-8 text-sm text-slate-500 md:px-6" colSpan={4}>
                        No transition data yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="animate-rise" style={{ animationDelay: "320ms" }}>
            <UploadForm />
          </div>
        </section>
      </div>
    </main>
  );
}
