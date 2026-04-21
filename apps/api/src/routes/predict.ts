import { FastifyInstance } from "fastify";
import { and, desc, eq, sql } from "drizzle-orm";
import { predictFromCandidates } from "@repo/engine";
import { db, states, transitions } from "@repo/db";

export default async function predictRoute(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    try {
      const currentState = (request.query as { currentState?: string })
        .currentState;

      if (!currentState) {
        return reply.status(400).send({
          error: "currentState is required",
        });
      }

      const accountId = process.env.SEQUENCE_DEV_ACCOUNT_ID;

      if (!accountId) {
        return reply.status(500).send({
          error: "Missing SEQUENCE_DEV_ACCOUNT_ID",
        });
      }

      const current = await db.query.states.findFirst({
        where: eq(states.name, currentState),
      });

      if (!current) {
        return reply.status(404).send({
          error: "State not found",
        });
      }

      const outgoingTransitions = await db
        .select({
          toStateId: transitions.toStateId,
          toStateName: states.name,
          count: sql<number>`sum(${transitions.count})`,
        })
        .from(transitions)
        .innerJoin(states, eq(transitions.toStateId, states.id))
        .where(
          and(
            eq(transitions.fromStateId, current.id),
            eq(transitions.accountId, accountId)
          )
        )
        .groupBy(transitions.toStateId, states.name)
        .orderBy(desc(sql<number>`sum(${transitions.count})`));

      const result = predictFromCandidates(
        outgoingTransitions.map((transition) => ({
          toStateName: transition.toStateName,
          count: Number(transition.count),
        }))
      );

      if (result.prediction === null) {
        return reply.send({
          currentState,
          prediction: null,
          probability: null,
          message: "No outgoing transitions found",
        });
      }

      return reply.send({
        currentState,
        prediction: result.prediction,
        probability: result.probability,
        totalTransitions: result.totalTransitions,
      });
    } catch (error) {
      request.log.error({ error }, "PREDICT_ROUTE_ERROR");

      return reply.status(500).send({
        error: "Failed to get prediction",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
}