import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { states, transitions } from "@/db/schema";

export async function GET() {
    try {
        const fromStates = alias(states, "from_states");
        const toStates = alias(states, "to_states");

        const rows = await db
            .select({
                fromState: fromStates.name,
                toState: toStates.name,
                count: transitions.count,
            })
            .from(transitions)
            .innerJoin(fromStates, eq(transitions.fromStateId, fromStates.id))
            .innerJoin(toStates, eq(transitions.toStateId, toStates.id));

        const totalsByFromState = new Map<string, number>();

        for (const row of rows) {
            totalsByFromState.set(
                row.fromState,
                (totalsByFromState.get(row.fromState) ?? 0) + row.count
            );
        }

        const analytics = rows.map((row) => {
            const totalFromThisState = totalsByFromState.get(row.fromState) ?? 0;
            const probability = totalFromThisState > 0 ? row.count / totalFromThisState : 0;

            return {
                fromState: row.fromState,
                toState: row.toState,
                count: row.count,
                probability,
            };
        });

        return NextResponse.json({
            transitions: analytics,
        });
    } catch (error) {
        console.error("ANALYTICS_ROUTE_ERROR", error);

        return NextResponse.json(
            { error: "Failed to load analytics" },
            { status: 500 }
        )
    }
}