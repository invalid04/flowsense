import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { sessions, states, transitions } from "@/db/schema";
import { UnauthorizedError, getOrCreateAccount } from "@/lib/getOrCreateAccount";

type TrackBody = {
    sessionKey: string;
    fromState: string;
    toState: string;
}

function isUniqueViolation(error: unknown) {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "23505"
    );
}

async function getOrCreateSession(sessionKey: string, accountId: string) {
    let session = await db.query.sessions.findFirst({
        where: and(
            eq(sessions.sessionKey, sessionKey),
            eq(sessions.accountId, accountId),
        ),
    });

    if (session) return session;

    const existingBySessionKey = await db.query.sessions.findFirst({
        where: eq(sessions.sessionKey, sessionKey),
    });

    const scopedSessionKey =
        existingBySessionKey && existingBySessionKey.accountId !== accountId
            ? `${accountId}:${sessionKey}`
            : sessionKey;

    session = await db.query.sessions.findFirst({
        where: and(
            eq(sessions.sessionKey, scopedSessionKey),
            eq(sessions.accountId, accountId),
        ),
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
                eq(sessions.accountId, accountId),
            ),
        });

        if (!fallbackSession) {
            throw error;
        }

        return fallbackSession;
    }
}

export async function POST(request: NextRequest) {
    try {
        const account = await getOrCreateAccount();
        const body = (await request.json()) as TrackBody;
        const { sessionKey, fromState, toState } = body;

        if (!sessionKey || !fromState || !toState) {
            return NextResponse.json(
                { error: "sessionKey, fromState, and toState are required"},
                { status: 400 }
            )
        }

        const session = await getOrCreateSession(sessionKey, account.id);

        let from = await db.query.states.findFirst({
            where: eq(states.name, fromState),
        });

        if (!from) {
            const insertedFrom = await db
                .insert(states) 
                .values({ name: fromState })
                .returning();

            from = insertedFrom[0];
        } 

        let to = await db.query.states.findFirst({
            where: eq(states.name, toState),
        });

        if (!to) {
            const insertedTo = await db 
                .insert(states)
                .values({ name: toState })
                .returning();

            to = insertedTo[0];
        }

        const existingTransition = await db.query.transitions.findFirst({
            where: and(
                eq(transitions.sessionId, session.id),
                eq(transitions.fromStateId, from.id),
                eq(transitions.toStateId, to.id),
                eq(transitions.accountId, account.id),
            ),
        });

        if (existingTransition) {
            const updated = await db
                .update(transitions)
                .set({ count: existingTransition.count + 1 })
                .where(eq(transitions.id, existingTransition.id))
                .returning();

            return NextResponse.json({
                message: "Transition updated",
                transition: updated[0],
            });
        }

        const insertedTransition = await db
            .insert(transitions)
            .values({
                accountId: account.id,
                sessionId: session.id,
                fromStateId: from.id,
                toStateId: to.id,
                count: 1,
            })
            .returning();

        return NextResponse.json({
            message: "Transition recorded",
            transition: insertedTransition[0],
        });
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        console.error("TRACK_ROUTE_ERROR", error);

        return NextResponse.json(
            { error: "Failed to record transition" },
            { status: 500}
        )
    }
}
