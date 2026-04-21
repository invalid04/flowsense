import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { detectDropoffCandidates } from "@repo/engine";
import { db } from "@/db";
import { states, transitions } from "@/db/schema";
import { UnauthorizedError, getOrCreateAccount } from "@/lib/getOrCreateAccount";

export async function GET() {
  try {
    const account = await getOrCreateAccount();

    const incomingRows = await db
      .select({
        stateId: transitions.toStateId,
        stateName: states.name,
        incomingCount: sql<number>`sum(${transitions.count})`,
      })
      .from(transitions)
      .innerJoin(states, eq(transitions.toStateId, states.id))
      .where(eq(transitions.accountId, account.id))
      .groupBy(transitions.toStateId, states.name);

    const outgoingRows = await db
      .select({
        stateId: transitions.fromStateId,
        outgoingCount: sql<number>`sum(${transitions.count})`,
      })
      .from(transitions)
      .where(eq(transitions.accountId, account.id))
      .groupBy(transitions.fromStateId);

    const outgoingMap = new Map<string, number>();

    for (const row of outgoingRows) {
      outgoingMap.set(row.stateId, Number(row.outgoingCount));
    }

    const result = detectDropoffCandidates(
      incomingRows.map((row) => ({
        stateId: row.stateId,
        stateName: row.stateName,
        incomingCount: Number(row.incomingCount),
        outgoingCount: outgoingMap.get(row.stateId) ?? 0,
      }))
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.error("DROPOFF_INSIGHT_ERROR", error);

    return NextResponse.json(
      { error: "Failed to load drop-off insight" },
      { status: 500 }
    );
  }
}