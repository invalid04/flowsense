import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { sessions, states, transitions } from "@/db/schema";

type TrackBody = {
    sessionKey: string;
    fromState: string;
    toState: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as TrackBody;
        const { sessionKey, fromState, toState } = body;

        if (!sessionKey || !fromState || !toState) {
            return NextResponse.json(
                { error: "sessionKey, fromState, and toState are required"},
                { status: 400 }
            )
        }

        let session = await db.query.sessions.findFirst({
            where: eq(sessions.sessionKey, sessionKey),
        });

        if (!session) {
            const insertedSession = await db
                .insert(sessions)
                .values({ sessionKey })
                .returning();

            session = insertedSession[0];
        } 

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
        console.error("TRACK_ROUTE_ERROR", error);

        return NextResponse.json(
            { error: "Failed to record transition" },
            { status: 500}
        )
    }
}