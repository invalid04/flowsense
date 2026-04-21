import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { states, transitions } from "@/db/schema";
import { UnauthorizedError, getOrCreateAccount } from "@/lib/getOrCreateAccount";

export async function GET(req: NextRequest) {
    try {
        const account = await getOrCreateAccount();
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

        const rows = await db
            .select({
                toStateName: states.name,
                count: sql<number>`sum(${transitions.count})`,
            })
            .from(transitions)
            .innerJoin(states, eq(transitions.toStateId, states.id))
            .where(
                and(
                    eq(transitions.fromStateId, current.id),
                    eq(transitions.accountId, account.id)
                )
            )
            .groupBy(states.name)
            .orderBy(desc(sql<number>`sum(${transitions.count})`));

        const total = rows.reduce((sum, row) => sum + Number(row.count), 0);

        const data = rows.map((row) => {
            const count = Number(row.count);
            return {
                toState: row.toStateName,
                count,
                probability: total > 0 ? count / total : 0,
            };
        });

        return NextResponse.json({
            currentState,
            transition: data,
        });
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        console.error("STATE_TRANSITIONS_ROUTE_ERROR", error);

        return NextResponse.json(
            { error: "Failed to load state transitions" },
            { status: 500 }
        );
    }
}
