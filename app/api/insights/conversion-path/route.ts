import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { states, transitions } from "@/db/schema";
import { UnauthorizedError, getOrCreateAccount } from "@/lib/getOrCreateAccount";
import { resolveConversionStatesForAccount } from "@/lib/resolveConversionStatesForAccount";

const MAX_STEPS = 10;

export async function GET(req: NextRequest) {
  try {
    const account = await getOrCreateAccount();
    const { searchParams } = new URL(req.url);
    const startStateParam = searchParams.get("startState") ?? "/home";

    const conversionStatesParam = searchParams.get("conversionStates");
    const conversionStates = new Set(
      await resolveConversionStatesForAccount({
        accountId: account.id,
        requestedStates: conversionStatesParam
          ? conversionStatesParam.split(",")
          : undefined,
      })
    );

    const startState = await db.query.states.findFirst({
      where: eq(states.name, startStateParam),
    });

    if (!startState) {
      return NextResponse.json(
        { error: "Start state not found" },
        { status: 404 }
      );
    }

    const path = [startState.name];
    const visited = new Set<string>([startState.name]);

    let currentStateId = startState.id;
    let currentStateName = startState.name;
    let endedReason:
      | "reached_conversion_state"
      | "no_outgoing_transitions"
      | "loop_detected"
      | "max_steps_reached" = "max_steps_reached";

    for (let step = 0; step < MAX_STEPS; step++) {
      if (step > 0 && conversionStates.has(currentStateName)) {
        endedReason = "reached_conversion_state";
        break;
      }

      const outgoingRows = await db
        .select({
          toStateId: transitions.toStateId,
          toStateName: states.name,
          count: sql<number>`sum(${transitions.count})`,
        })
        .from(transitions)
        .innerJoin(states, eq(transitions.toStateId, states.id))
        .where(
          and(
            eq(transitions.fromStateId, currentStateId),
            eq(transitions.accountId, account.id)
          )
        )
        .groupBy(transitions.toStateId, states.name)
        .orderBy(desc(sql<number>`sum(${transitions.count})`));

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

    return NextResponse.json({
      startState: startState.name,
      conversionStates: Array.from(conversionStates),
      path,
      endedReason,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.error("CONVERSION_PATH_INSIGHT_ERROR", error);

    return NextResponse.json(
      { error: "Failed to load conversion path insight" },
      { status: 500 }
    );
  }
}
