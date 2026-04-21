import { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { db, sessions, states, transitions } from "@repo/db";
import { getAccountIdFromApiKey } from "../lib/getAccountIdFromApiKey";

type TrackBody = {
  sessionKey: string;
  fromState: string;
  toState: string;
};

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
      eq(sessions.accountId, accountId)
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
      eq(sessions.accountId, accountId)
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
        eq(sessions.accountId, accountId)
      ),
    });

    if (!fallbackSession) {
      throw error;
    }

    return fallbackSession;
  }
}

async function getOrCreateState(stateName: string) {
  let state = await db.query.states.findFirst({
    where: eq(states.name, stateName),
  });

  if (state) return state;

  const inserted = await db
    .insert(states)
    .values({ name: stateName })
    .returning();

  return inserted[0];
}

export default async function trackRoute(app: FastifyInstance) {
  app.post("/", async (request, reply) => {
    try {
      const body = request.body as TrackBody;
      const { sessionKey, fromState, toState } = body;

      if (!sessionKey || !fromState || !toState) {
        return reply.status(400).send({
          error: "sessionKey, fromState, and toState are required",
        });
      }

      const accountId = await getAccountIdFromApiKey(
        request.headers.authorization
      );

      if (!accountId) {
        return reply.status(401).send({
          error: "Unauthorized",
        });
      }

      const session = await getOrCreateSession(sessionKey, accountId);
      const from = await getOrCreateState(fromState);
      const to = await getOrCreateState(toState);

      const existingTransition = await db.query.transitions.findFirst({
        where: and(
          eq(transitions.sessionId, session.id),
          eq(transitions.fromStateId, from.id),
          eq(transitions.toStateId, to.id),
          eq(transitions.accountId, accountId)
        ),
      });

      if (existingTransition) {
        const updated = await db
          .update(transitions)
          .set({ count: existingTransition.count + 1 })
          .where(eq(transitions.id, existingTransition.id))
          .returning();

        return reply.send({
          message: "Transition updated",
          transition: updated[0],
        });
      }

      const insertedTransition = await db
        .insert(transitions)
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
    } catch (error) {
      request.log.error({ error }, "TRACK_ROUTE_ERROR");

      return reply.status(500).send({
        error: "Failed to record transition",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
