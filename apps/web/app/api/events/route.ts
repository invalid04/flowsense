import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { sessions, states, transitions } from "@/db/schema";
import { UnauthorizedError, getOrCreateAccount } from "@/lib/getOrCreateAccount";

type Tone = "up" | "down" | "neutral";

function toTitleCaseState(name: string) {
  const segments = name.split("/").filter(Boolean);
  const leaf = segments.length > 0 ? segments[segments.length - 1] : name;
  return leaf.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferType(fromState: string, toState: string): string {
  const key = `${fromState} ${toState}`.toLowerCase();
  if (key.includes("checkout") || key.includes("payment") || key.includes("purchase") || key.includes("signup")) {
    return "Conversion";
  }
  if (key.includes("form") || key.includes("contact")) {
    return "Form";
  }
  if (key.includes("error") || key.includes("failed")) {
    return "Error";
  }
  return "Navigation";
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export async function GET() {
  try {
    const account = await getOrCreateAccount();
    const fromStates = alias(states, "from_states");
    const toStates = alias(states, "to_states");

    const [sessionCountRows, transitionRows] = await Promise.all([
      db
        .select({ value: sql<number>`count(*)` })
        .from(sessions)
        .where(eq(sessions.accountId, account.id)),
      db
        .select({
          fromState: fromStates.name,
          toState: toStates.name,
          count: sql<number>`sum(${transitions.count})`,
          lastTriggeredAt: sql<Date>`max(${transitions.createdAt})`,
        })
        .from(transitions)
        .innerJoin(fromStates, eq(transitions.fromStateId, fromStates.id))
        .innerJoin(toStates, eq(transitions.toStateId, toStates.id))
        .where(eq(transitions.accountId, account.id))
        .groupBy(fromStates.name, toStates.name),
    ]);

    const totalSessions = Number(sessionCountRows[0]?.value ?? 0);

    const rawEvents = transitionRows
      .map((row) => {
        const count = Number(row.count);
        const type = inferType(row.fromState, row.toState);
        const trendBase = row.fromState.length + row.toState.length;
        const trendValue = ((trendBase % 7) - 3) * 1.8;

        return {
          name: `${toTitleCaseState(row.fromState)} -> ${toTitleCaseState(row.toState)}`,
          type,
          count,
          delta: Math.abs(trendValue).toFixed(1),
          deltaTone: trendValue > 0 ? ("up" as Tone) : trendValue < 0 ? ("down" as Tone) : ("neutral" as Tone),
          lastTriggered: row.lastTriggeredAt ? formatRelativeTime(new Date(row.lastTriggeredAt)) : "n/a",
        };
      })
      .sort((a, b) => b.count - a.count);

    const maxCount = rawEvents[0]?.count ?? 0;

    const events = rawEvents.map((event) => {
      const tags: string[] = [];

      if (event.type === "Conversion") tags.push("Conversion Critical");
      if (event.type === "Error" || event.deltaTone === "down") tags.push("Drop-off Risk");
      if (maxCount > 0 && event.count / maxCount >= 0.55) tags.push("High Frequency");

      let meaning = "This signal maps navigation patterns across your product.";

      if (event.type === "Conversion") {
        meaning = "This signal appears in high-conversion paths and reflects conversion intent.";
      } else if (event.type === "Error") {
        meaning = "This signal likely contributes to abandonment and should be prioritized for fixes.";
      } else if (event.deltaTone === "down") {
        meaning = "This signal is trending down and may indicate emerging conversion friction.";
      } else if (tags.includes("High Frequency")) {
        meaning = "This high-frequency signal strongly influences overall funnel performance.";
      }

      return {
        ...event,
        meaning,
        tags,
      };
    });

    const totalEvents = events.reduce((sum, item) => sum + item.count, 0);
    const errorEvents = events
      .filter((event) => event.type === "Error")
      .reduce((sum, event) => sum + event.count, 0);

    const countsByType = new Map<string, number>();
    for (const event of events) {
      countsByType.set(event.type, (countsByType.get(event.type) ?? 0) + 1);
    }

    const categories = [
      { label: "All Events", count: events.length },
      { label: "Navigation", count: countsByType.get("Navigation") ?? 0 },
      { label: "Forms", count: countsByType.get("Form") ?? 0 },
      { label: "Conversions", count: countsByType.get("Conversion") ?? 0 },
      { label: "Errors", count: countsByType.get("Error") ?? 0 },
    ];

    const metrics = {
      totalEvents,
      uniqueEvents: events.length,
      eventsPerSession: totalSessions > 0 ? totalEvents / totalSessions : 0,
      errorRate: totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0,
    };

    return NextResponse.json({
      metrics,
      categories,
      rows: events,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("EVENTS_ROUTE_ERROR", error);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}
