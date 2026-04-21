"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = trackRoute;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("@repo/db");
function isUniqueViolation(error) {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505");
}
async function getOrCreateSession(sessionKey, accountId) {
    let session = await db_1.db.query.sessions.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.sessions.sessionKey, sessionKey), (0, drizzle_orm_1.eq)(db_1.sessions.accountId, accountId)),
    });
    if (session)
        return session;
    const existingBySessionKey = await db_1.db.query.sessions.findFirst({
        where: (0, drizzle_orm_1.eq)(db_1.sessions.sessionKey, sessionKey),
    });
    const scopedSessionKey = existingBySessionKey && existingBySessionKey.accountId !== accountId
        ? `${accountId}:${sessionKey}`
        : sessionKey;
    session = await db_1.db.query.sessions.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.sessions.sessionKey, scopedSessionKey), (0, drizzle_orm_1.eq)(db_1.sessions.accountId, accountId)),
    });
    if (session)
        return session;
    try {
        const [newSession] = await db_1.db
            .insert(db_1.sessions)
            .values({
            sessionKey: scopedSessionKey,
            accountId,
        })
            .returning();
        return newSession;
    }
    catch (error) {
        if (!isUniqueViolation(error)) {
            throw error;
        }
        const fallbackSession = await db_1.db.query.sessions.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.sessions.sessionKey, scopedSessionKey), (0, drizzle_orm_1.eq)(db_1.sessions.accountId, accountId)),
        });
        if (!fallbackSession) {
            throw error;
        }
        return fallbackSession;
    }
}
async function getOrCreateState(stateName) {
    let state = await db_1.db.query.states.findFirst({
        where: (0, drizzle_orm_1.eq)(db_1.states.name, stateName),
    });
    if (state)
        return state;
    const inserted = await db_1.db
        .insert(db_1.states)
        .values({ name: stateName })
        .returning();
    return inserted[0];
}
async function trackRoute(app) {
    app.post("/", async (request, reply) => {
        try {
            const body = request.body;
            const { sessionKey, fromState, toState } = body;
            if (!sessionKey || !fromState || !toState) {
                return reply.status(400).send({
                    error: "sessionKey, fromState, and toState are required",
                });
            }
            // Temporary until API keys are wired up
            const accountId = "dev-account";
            const session = await getOrCreateSession(sessionKey, accountId);
            const from = await getOrCreateState(fromState);
            const to = await getOrCreateState(toState);
            const existingTransition = await db_1.db.query.transitions.findFirst({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.transitions.sessionId, session.id), (0, drizzle_orm_1.eq)(db_1.transitions.fromStateId, from.id), (0, drizzle_orm_1.eq)(db_1.transitions.toStateId, to.id), (0, drizzle_orm_1.eq)(db_1.transitions.accountId, accountId)),
            });
            if (existingTransition) {
                const updated = await db_1.db
                    .update(db_1.transitions)
                    .set({ count: existingTransition.count + 1 })
                    .where((0, drizzle_orm_1.eq)(db_1.transitions.id, existingTransition.id))
                    .returning();
                return reply.send({
                    message: "Transition updated",
                    transition: updated[0],
                });
            }
            const insertedTransition = await db_1.db
                .insert(db_1.transitions)
                .values({
                accountId,
                sessionId: session.id,
                fromStateId: from.id,
                toStateId: to.id,
                count: 1,
            })
                .returning();
            return reply.send({
                message: "Transition recorded",
                transition: insertedTransition[0],
            });
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({
                error: "Failed to record transition",
            });
        }
    });
}
