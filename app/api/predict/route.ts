import { NextRequest, NextResponse } from "next/server";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { states, transitions } from "@/db/schema";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const currentState = searchParams.get("currentState");

    if (!currentState) {
      return NextResponse.json(
        { error: "currentState is required" },
        { status: 400 }
      );
    }

    const current = await db.query.states.findFirst({
      where: eq(states.name, currentState),
    });

    if (!current) {
      return NextResponse.json(
        { error: "State not found" },
        { status: 404 }
      );
    }

    const outgoingTransitions = await db
      .select({
        toStateId: transitions.toStateId,
        toStateName: states.name,
        count: sql<number>`sum(${transitions.count})`
      })
      .from(transitions)
      .innerJoin(states, eq(transitions.toStateId, states.id))
      .where(eq(transitions.fromStateId, current.id))
      .groupBy(transitions.toStateId, states.name)
      .orderBy(desc(sql<number>`sum(${transitions.count})`));

    if (outgoingTransitions.length === 0) {
      return NextResponse.json({
        currentState,
        prediction: null,
        probability: null,
        message: "No outgoing transitions found",
      });
    }

    const total = outgoingTransitions.reduce(
        (sum, t) => sum + Number(t.count),
        0
    )
    const top = outgoingTransitions[0];
    const probability = top.count / total;

    return NextResponse.json({
      currentState,
      prediction: top.toStateName,
      probability,
      totalTransitions: total,
    });
  } catch (error) {
    console.error("PREDICT_ROUTE_ERROR", error);

    return NextResponse.json(
      { error: "Failed to get prediction" },
      { status: 500 }
    );
  }
}