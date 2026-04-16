import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { states, transitions } from "@/db/schema";
import { UnauthorizedError, getOrCreateAccount } from "@/lib/getOrCreateAccount";

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
            .groupBy(fromStates.name, toStates.name)

        const totalsByFromState = new Map<string, number>();

        for (const row of rows) {
            totalsByFromState.set(
                row.fromState,
                (totalsByFromState.get(row.fromState) ?? 0) + Number(row.count)
            );
        }

        const analytics = rows.map((row) => {
            const count = Number(row.count);
            const totalFromThisState = totalsByFromState.get(row.fromState) ?? 0;
            const probability = totalFromThisState > 0 ? count / totalFromThisState : 0;

            return {
                fromState: row.fromState,
                toState: row.toState,
                count,
                probability,
            };
        });

        return NextResponse.json({
            transitions: analytics,
        });
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        console.error("ANALYTICS_ROUTE_ERROR", error);

        return NextResponse.json(
            { error: "Failed to load analytics" },
            { status: 500 }
        )
    }
}
