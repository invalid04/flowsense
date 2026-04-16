import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { states, transitions } from "@/db/schema";
import { UnauthorizedError, getOrCreateAccount } from "@/lib/getOrCreateAccount";

type FlowStage = {
  label: string;
  sessions: number;
  percent: number;
  status?: "start" | "end";
  tone?: "neutral" | "drop" | "success";
  drop?: number;
};

type Flow = {
  name: string;
  stages: FlowStage[];
};

function toTitleCaseState(name: string) {
  const segments = name.split("/").filter(Boolean);
  const leaf = segments.length > 0 ? segments[segments.length - 1] : name;
  return leaf.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function GET() {
  try {
    const account = await getOrCreateAccount();
    const fromStates = alias(states, "from_states");
    const toStates = alias(states, "to_states");

    const rows = await db
      .select({
        fromState: fromStates.name,
        toState: toStates.name,
        count: sql<number>`sum(${transitions.count})`,
      })
      .from(transitions)
      .innerJoin(fromStates, eq(transitions.fromStateId, fromStates.id))
      .innerJoin(toStates, eq(transitions.toStateId, toStates.id))
      .where(eq(transitions.accountId, account.id))
      .groupBy(fromStates.name, toStates.name);

    const outgoingTotals = new Map<string, number>();
    const incomingTotals = new Map<string, number>();
    const outgoingEdges = new Map<string, Array<{ toState: string; count: number }>>();

    for (const row of rows) {
      const count = Number(row.count);
      outgoingTotals.set(row.fromState, (outgoingTotals.get(row.fromState) ?? 0) + count);
      incomingTotals.set(row.toState, (incomingTotals.get(row.toState) ?? 0) + count);

      const edges = outgoingEdges.get(row.fromState) ?? [];
      edges.push({ toState: row.toState, count });
      outgoingEdges.set(row.fromState, edges);
    }

    for (const [state, edges] of outgoingEdges.entries()) {
      edges.sort((a, b) => b.count - a.count);
      outgoingEdges.set(state, edges);
    }

    const startCandidates = Array.from(outgoingTotals.keys())
      .filter((state) => !incomingTotals.has(state))
      .sort((a, b) => (outgoingTotals.get(b) ?? 0) - (outgoingTotals.get(a) ?? 0));

    const fallbackStarts = Array.from(outgoingTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([state]) => state);

    const startStates = [...startCandidates, ...fallbackStarts].filter(
      (state, index, list) => list.indexOf(state) === index
    );

    const flows: Flow[] = [];

    for (const startState of startStates) {
      if (flows.length >= 3) break;

      const visited = new Set<string>([startState]);
      const sequence = [startState];
      let cursor = startState;

      for (let step = 0; step < 5; step++) {
        const edges = outgoingEdges.get(cursor) ?? [];
        const next = edges.find((edge) => !visited.has(edge.toState));
        if (!next) break;

        sequence.push(next.toState);
        visited.add(next.toState);
        cursor = next.toState;
      }

      if (sequence.length < 2) continue;

      const firstVolume = outgoingTotals.get(sequence[0]) ?? 0;
      if (firstVolume === 0) continue;

      const stages: FlowStage[] = sequence.map((state, index) => {
        const stateVolume =
          outgoingTotals.get(state) ?? incomingTotals.get(state) ?? firstVolume;

        const previousState = index > 0 ? sequence[index - 1] : null;
        const previousVolume = previousState
          ? outgoingTotals.get(previousState) ?? incomingTotals.get(previousState) ?? firstVolume
          : null;

        const drop =
          previousVolume && previousVolume > 0
            ? Math.max(0, ((previousVolume - stateVolume) / previousVolume) * 100)
            : undefined;

        return {
          label: toTitleCaseState(state),
          sessions: Math.round(stateVolume),
          percent: Math.max(1, Math.min(100, Math.round((stateVolume / firstVolume) * 100))),
          status: index === 0 ? "start" : index === sequence.length - 1 ? "end" : undefined,
          tone: index === sequence.length - 1 ? "success" : drop && drop > 10 ? "drop" : "neutral",
          drop,
        };
      });

      flows.push({
        name: `${toTitleCaseState(startState)} Flow`,
        stages,
      });
    }

    const activeFlows = flows.length;
    const completionRates = flows.map((flow) => {
      const start = flow.stages[0]?.sessions ?? 0;
      const end = flow.stages[flow.stages.length - 1]?.sessions ?? 0;
      return start > 0 ? (end / start) * 100 : 0;
    });

    const avgCompletion =
      completionRates.length > 0
        ? completionRates.reduce((sum, value) => sum + value, 0) / completionRates.length
        : 0;

    const totalDropoffs = flows.reduce((sum, flow) => {
      const start = flow.stages[0]?.sessions ?? 0;
      const end = flow.stages[flow.stages.length - 1]?.sessions ?? 0;
      return sum + Math.max(0, start - end);
    }, 0);

    const conversionRate = avgCompletion;

    return NextResponse.json({
      metrics: {
        activeFlows,
        avgCompletion,
        totalDropoffs,
        conversionRate,
      },
      flows,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("FLOWS_ROUTE_ERROR", error);
    return NextResponse.json({ error: "Failed to load flows" }, { status: 500 });
  }
}
