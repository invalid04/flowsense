import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, states, transitions, accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAccountByApiKey, extractApiKey } from "@/lib/getAccountByApiKey";

export async function POST(req: NextRequest) {
    try {
        const apiKey = extractApiKey(req);
        const account = await getAccountByApiKey(apiKey || "");

        if (!account) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { sessionId, state } = body;

        if (!sessionId || !state) {
            return NextResponse.json(
                { error: "sessionId and state are required" },
                { status: 400 }
            );
        }

        let session = await db.query.sessions.findFirst({
            where: and(
                eq(sessions.sessionKey, sessionId),
                eq(sessions.accountId, account.id)
            )
        });

        if (!session) {
            const [newSession] = await db
                .insert(sessions)
                .values({
                    sessionKey: sessionId,
                    accountId: account.id,
                })
                .returning();

            session = newSession;
        }

        let currentState = await db.query.states.findFirst({
            where: eq(states.name, state)
        });

        if (!currentState) {
            const [newState] = await db
                .insert(states)
                .values({ name: state })
                .returning(); 

            currentState = newState;
        }

        if (!session.lastStateId) {
            await db 
                .update(sessions)
                .set({ lastStateId: currentState.id })
                .where(eq(sessions.id, session.id));

            return NextResponse.json({
                message: "First state recorded"
            })
        }

        const existingTransition = await db.query.transitions.findFirst({
            where: and(
                eq(transitions.sessionId, session.id),
                eq(transitions.fromStateId, session.lastStateId),
                eq(transitions.toStateId, currentState.id),
                eq(transitions.accountId, account.id)
            ),
        });

        if (existingTransition) {
            await db 
                .update(transitions)
                .set({
                    count: existingTransition.count + 1, 
                })
                .where(eq(transitions.id, existingTransition.id));
        } else {
            await db.insert(transitions).values({
                sessionId: session.id,
                fromStateId: session.lastStateId,
                toStateId: currentState.id,
                accountId: account.id,
            });
        }

        await db 
            .update(sessions)
            .set({ lastStateId: currentState.id })
            .where(eq(sessions.id, session.id));

        return NextResponse.json({
            message: "Event processed",
        });
    } catch (error) {
        console.error("INGEST_ERROR", error);

        return NextResponse.json(
            { error: "Failed to ingest event" },
            { status: 500 }
        );
    }
}