import { FastifyInstance } from "fastify";
import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, states, transitions } from "@repo/db";
import { resolveAccountIdForRequest } from "../lib/resolveAccountIdForRequest";

export default async function analyticsRoute(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    try {
      const accountId = await resolveAccountIdForRequest(request);

      if (!accountId) {
        return reply.status(401).send({
          error: "Unauthorized",
        });
      }

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
        .where(eq(transitions.accountId, accountId))
        .groupBy(fromStates.name, toStates.name);

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
        const probability =
          totalFromThisState > 0 ? count / totalFromThisState : 0;

        return {
          fromState: row.fromState,
          toState: row.toState,
          count,
          probability,
        };
      });

      return reply.send({
        transitions: analytics,
      });
    } catch (error) {
      request.log.error({ error }, "ANALYTICS_ROUTE_ERROR");

      return reply.status(500).send({
        error: "Failed to load analytics",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
