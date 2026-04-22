import { FastifyInstance } from "fastify";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, states, transitions } from "@repo/db";
import { resolveAccountIdForRequest } from "../lib/resolveAccountIdForRequest";

export default async function stateTransitionsRoute(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    try {
      const currentState = (request.query as { currentState?: string })
        .currentState;

      if (!currentState) {
        return reply.status(400).send({
          error: "currentState is required",
        });
      }

      const accountId = await resolveAccountIdForRequest(request);

      if (!accountId) {
        return reply.status(401).send({
          error: "Unauthorized",
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
            eq(transitions.accountId, accountId)
          )
        )
        .groupBy(states.name)
        .orderBy(desc(sql<number>`sum(${transitions.count})`));

      const total = rows.reduce((sum, row) => sum + Number(row.count), 0);

      const transition = rows.map((row) => {
        const count = Number(row.count);

        return {
          toState: row.toStateName,
          count,
          probability: total > 0 ? count / total : 0,
        };
      });

      return reply.send({
        currentState,
        transition,
      });
    } catch (error) {
      request.log.error({ error }, "STATE_TRANSITIONS_ROUTE_ERROR");

      return reply.status(500).send({
        error: "Failed to load state transitions",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
