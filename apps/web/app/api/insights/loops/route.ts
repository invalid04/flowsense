import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { detectLoops } from "@repo/engine";
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

    const result = detectLoops(
      allTransitions.map((transition) => ({
        fromStateId: transition.fromStateId,
        toStateId: transition.toStateId,
        count: Number(transition.count),
      })),
      stateNameById
    );

    return NextResponse.json(result);
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