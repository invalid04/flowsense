import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { states, transitions } from "@/db/schema";

export async function GET() {
  try {
    const incomingRows = await db
      .select({
        stateId: transitions.toStateId,
        stateName: states.name,
        incomingCount: sql<number>`sum(${transitions.count})`,
      })
      .from(transitions)
      .innerJoin(states, eq(transitions.toStateId, states.id))
      .groupBy(transitions.toStateId, states.name);

    const outgoingRows = await db
      .select({
        stateId: transitions.fromStateId,
        outgoingCount: sql<number>`sum(${transitions.count})`,
      })
      .from(transitions)
      .groupBy(transitions.fromStateId);

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

    const biggestDropoff = dropoffCandidates[0] ?? null;

    return NextResponse.json({
      biggestDropoff,
      candidates: dropoffCandidates,
    });
  } catch (error) {
    console.error("DROPOFF_INSIGHT_ERROR", error);

    return NextResponse.json(
      { error: "Failed to load drop-off insight" },
      { status: 500 }
    );
  }
}