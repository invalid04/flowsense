import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { states, transitions } from "@/db/schema";

const DEFAULT_CONVERSION_STATES = [
  "/confirmation",
  "/checkout",
  "/signup",
  "/contact-sales",
];

type ResolveConversionStatesParams = {
  accountId: string;
  requestedStates?: string[];
};

export async function resolveConversionStatesForAccount({
  accountId,
  requestedStates,
}: ResolveConversionStatesParams): Promise<string[]> {
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
    .where(eq(transitions.accountId, accountId))
    .groupBy(fromStates.name, toStates.name);

  const availableStates = new Set<string>();
  const incomingCounts = new Map<string, number>();
  const outgoingCounts = new Map<string, number>();

  for (const row of rows) {
    const count = Number(row.count);
    availableStates.add(row.fromState);
    availableStates.add(row.toState);

    outgoingCounts.set(row.fromState, (outgoingCounts.get(row.fromState) ?? 0) + count);
    incomingCounts.set(row.toState, (incomingCounts.get(row.toState) ?? 0) + count);
  }

  const normalizeAndFilter = (statesToFilter: string[]) =>
    Array.from(
      new Set(
        statesToFilter
          .map((state) => state.trim())
          .filter((state) => state.length > 0 && availableStates.has(state))
      )
    );

  if (requestedStates && requestedStates.length > 0) {
    const matchedRequestedStates = normalizeAndFilter(requestedStates);
    if (matchedRequestedStates.length > 0) {
      return matchedRequestedStates;
    }
  }

  const matchedDefaultStates = normalizeAndFilter(DEFAULT_CONVERSION_STATES);
  if (matchedDefaultStates.length > 0) {
    return matchedDefaultStates;
  }

  const terminalStates = Array.from(availableStates)
    .filter((stateName) => {
      const incoming = incomingCounts.get(stateName) ?? 0;
      const outgoing = outgoingCounts.get(stateName) ?? 0;
      return incoming > 0 && outgoing === 0;
    })
    .sort((a, b) => {
      const incomingDiff = (incomingCounts.get(b) ?? 0) - (incomingCounts.get(a) ?? 0);
      if (incomingDiff !== 0) return incomingDiff;
      return a.localeCompare(b);
    });

  if (terminalStates.length > 0) {
    return terminalStates;
  }

  return Array.from(availableStates).sort((a, b) => a.localeCompare(b)).slice(0, 4);
}
