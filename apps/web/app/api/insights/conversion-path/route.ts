import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { buildConversionPath } from "@repo/engine";
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

    const allStates = await db.select().from(states);
    const stateNameById = new Map<string, string>();
    for (const state of allStates) {
      stateNameById.set(state.id, state.name);
    }

    const allTransitions = await db
      .select()
      .from(transitions)
      .where(eq(transitions.accountId, account.id));

    const engineTransitions = allTransitions
      .map((transition) => {
        const fromStateName = stateNameById.get(transition.fromStateId);
        const toStateName = stateNameById.get(transition.toStateId);

        if (!fromStateName || !toStateName) {
          return null;
        }

        return {
          fromStateName,
          toStateName,
          count: Number(transition.count),
        };
      })
      .filter(
        (
          transition
        ): transition is {
          fromStateName: string;
          toStateName: string;
          count: number;
        } => transition !== null
      );

    const result = buildConversionPath({
      startState: startState.name,
      conversionStates,
      transitions: engineTransitions,
      maxSteps: MAX_STEPS,
    });

    return NextResponse.json({
      startState: startState.name,
      conversionStates: Array.from(conversionStates),
      path: result.path,
      endedReason: result.endedReason,
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