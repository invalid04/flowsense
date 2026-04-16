import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, states, transitions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAccountByApiKey, extractApiKey } from "@/lib/getAccountByApiKey";

function isUniqueViolation(error: unknown) {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "23505"
    );
}

async function getOrCreateSession(sessionId: string, accountId: string) {
    let session = await db.query.sessions.findFirst({
        where: and(
            eq(sessions.sessionKey, sessionId),
            eq(sessions.accountId, accountId)
        )
    });

    if (session) return session;

    const existingBySessionKey = await db.query.sessions.findFirst({
        where: eq(sessions.sessionKey, sessionId),
    });

    const scopedSessionKey =
        existingBySessionKey && existingBySessionKey.accountId !== accountId
            ? `${accountId}:${sessionId}`
            : sessionId;

    session = await db.query.sessions.findFirst({
        where: and(
            eq(sessions.sessionKey, scopedSessionKey),
            eq(sessions.accountId, accountId)
        )
    });

    if (session) return session;

    try {
        const [newSession] = await db
            .insert(sessions)
            .values({
                sessionKey: scopedSessionKey,
                accountId,
            })
            .returning();

        return newSession;
    } catch (error) {
        if (!isUniqueViolation(error)) {
            throw error;
        }

        const fallbackSession = await db.query.sessions.findFirst({
            where: and(
                eq(sessions.sessionKey, scopedSessionKey),
                eq(sessions.accountId, accountId)
            ),
        });

        if (!fallbackSession) {
            throw error;
        }

        return fallbackSession;
    }
}

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

        const session = await getOrCreateSession(sessionId, account.id);

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
