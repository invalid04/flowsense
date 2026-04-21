import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { states, transitions } from "@/db/schema";
import { UnauthorizedError, getOrCreateAccount } from "@/lib/getOrCreateAccount";

export async function GET() {
  try {
    const account = await getOrCreateAccount();
    const allStates = await db.select().from(states);

    const stateNameById = new Map<string, string>();
    for (const state of allStates) {
      stateNameById.set(state.id, state.name);
    }

    const allTransitions = await db
      .select()
      .from(transitions)
      .where(eq(transitions.accountId, account.id));

    const transitionCountMap = new Map<string, number>();

    for (const transition of allTransitions) {
      const key = `${transition.fromStateId}->${transition.toStateId}`;
      transitionCountMap.set(key, Number(transition.count));
    }

    const loops: {
      type: "two-state" | "self";
      states: string[];
      totalCount: number;
    }[] = [];

    const visitedPairs = new Set<string>();

    for (const transition of allTransitions) {
      const fromId = transition.fromStateId;
      const toId = transition.toStateId;

      // self loop: A -> A
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

      // two-state loop: A -> B and B -> A
      const forwardKey = `${fromId}->${toId}`;
      const reverseKey = `${toId}->${fromId}`;

      if (!transitionCountMap.has(reverseKey)) {
        continue;
      }

      // prevent duplicate pairs
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

    const topLoop = loops[0] ?? null;

    return NextResponse.json({
      topLoop,
      loops,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.error("LOOP_INSIGHT_ERROR", error);

    return NextResponse.json(
      { error: "Failed to detect loops" },
      { status: 500 }
    );
  }
}
