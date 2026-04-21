import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@repo/db";
import { states, transitions } from "@repo/db";
import { UnauthorizedError, getOrCreateAccount } from "@/lib/getOrCreateAccount";
import { buildInsightText } from "@/lib/insightText";

type IssueType = "dropoff" | "empty";

type SummaryInsight = {
  headline: string;
  keyMetric: string;
  context: string;
  impact: string;
  estimatedImpact: string;
  recommendedAction: string;
  fromState: string;
  toState: string;
  transitionCount: number;
  nextStepCount: number;
  dropoffRate: number;
  totalTransitions: number;
  shareOfLoss: number;
  issueType: IssueType;
  impactLabel: "High Impact" | "Medium Impact" | "Low Impact";
  impactScore: number;
  impactRange: string;
  summary: string;
};

function getImpactLabel(impactScore: number): SummaryInsight["impactLabel"] {
  if (impactScore >= 70) return "High Impact";
  if (impactScore >= 40) return "Medium Impact";
  return "Low Impact";
}

function buildEmptySummary(): SummaryInsight {
  return {
    headline: "No modeled behavior yet in your funnel",
    keyMetric: "0% of users exit at any modeled step (0 -> 0 sessions).",
    context: "This transition (/home -> /home) is a critical step in your primary conversion path.",
    impact: "This step accounts for 0% of total funnel loss across 0 modeled transitions.",
    estimatedImpact: "Improving this step could increase conversions by +0-0%.",
    recommendedAction: "Connect product data and capture transition events for all key funnel steps.",
    fromState: "/home",
    toState: "/home",
    transitionCount: 0,
    nextStepCount: 0,
    dropoffRate: 0,
    totalTransitions: 0,
    shareOfLoss: 0,
    issueType: "empty",
    impactLabel: "Low Impact",
    impactScore: 0,
    impactRange: "0-0%",
    summary: "0% of users exit at any modeled step (0 -> 0 sessions).",
  };
}

export async function GET() {
  try {
    const account = await getOrCreateAccount();

    const accountTransitions = await db
      .select({
        fromStateId: transitions.fromStateId,
        toStateId: transitions.toStateId,
        count: transitions.count,
      })
      .from(transitions)
      .where(eq(transitions.accountId, account.id));

    if (accountTransitions.length === 0) {
      return NextResponse.json(buildEmptySummary());
    }

    const totalTransitions = accountTransitions.reduce(
      (sum, transition) => sum + Number(transition.count),
      0
    );

    if (totalTransitions <= 0) {
      return NextResponse.json(buildEmptySummary());
    }

    const uniqueStateIds = new Set<string>();

    for (const transition of accountTransitions) {
      uniqueStateIds.add(transition.fromStateId);
      uniqueStateIds.add(transition.toStateId);
    }

    const stateIdList = Array.from(uniqueStateIds);
    const stateRows = await db
      .select({ id: states.id, name: states.name })
      .from(states)
      .where(inArray(states.id, stateIdList));

    const stateNameById = new Map<string, string>();
    for (const state of stateRows) {
      stateNameById.set(state.id, state.name);
    }

    const outgoingByState = new Map<string, number>();
    const edgeCountByKey = new Map<string, number>();

    for (const transition of accountTransitions) {
      const count = Number(transition.count);
      outgoingByState.set(
        transition.fromStateId,
        (outgoingByState.get(transition.fromStateId) ?? 0) + count
      );

      const edgeKey = `${transition.fromStateId}->${transition.toStateId}`;
      edgeCountByKey.set(edgeKey, (edgeCountByKey.get(edgeKey) ?? 0) + count);
    }

    const dropoffBaseline = Array.from(edgeCountByKey.entries()).reduce(
      (sum, [edgeKey, count]) => {
        const [, toStateId] = edgeKey.split("->");
        if (!toStateId) {
          return sum;
        }
        const rawNextStepCount = outgoingByState.get(toStateId) ?? 0;
        const nextStepCount = Math.min(Math.max(rawNextStepCount, 0), count);
        const dropoffCount = Math.max(0, count - nextStepCount);
        return sum + dropoffCount;
      },
      0
    );

    const totalDropoffs = Math.max(1, dropoffBaseline);

    const candidates = Array.from(edgeCountByKey.entries()).map(([edgeKey, count]) => {
      const [fromStateId, toStateId] = edgeKey.split("->");
      const fromState = fromStateId ? stateNameById.get(fromStateId) ?? "Unknown step" : "Unknown step";
      const toState = toStateId ? stateNameById.get(toStateId) ?? "Unknown step" : "Unknown step";
      const nextStepCount = toStateId ? outgoingByState.get(toStateId) ?? 0 : 0;

      const insight = buildInsightText({
        fromState,
        toState,
        transitionCount: count,
        nextStepCount,
        totalDropoffs,
        totalTransitions,
        action: `Reduce required fields at ${toState}, simplify the flow after ${fromState}, and add trust signals near the primary CTA.`,
      });

      const impactScore = Math.round(insight.shareOfLoss * 70 + insight.dropoffRate * 30);

      return {
        ...insight,
        issueType: "dropoff" as const,
        impactScore,
      };
    });

    if (candidates.length === 0) {
      return NextResponse.json(buildEmptySummary());
    }

    candidates.sort((a, b) => {
      if (b.shareOfLoss !== a.shareOfLoss) {
        return b.shareOfLoss - a.shareOfLoss;
      }
      return b.dropoffCount - a.dropoffCount;
    });
    const topCandidate = candidates[0];
    const impactRange = `${topCandidate.estimatedLiftLow}-${topCandidate.estimatedLiftHigh}%`;

    return NextResponse.json({
      headline: topCandidate.headline,
      keyMetric: topCandidate.keyMetric,
      context: topCandidate.context,
      impact: topCandidate.impact,
      estimatedImpact: topCandidate.estimatedImpact,
      recommendedAction: topCandidate.recommendedAction,
      fromState: topCandidate.fromState,
      toState: topCandidate.toState,
      transitionCount: topCandidate.transitionCount,
      nextStepCount: topCandidate.nextStepCount,
      dropoffRate: topCandidate.dropoffRate,
      totalTransitions: topCandidate.totalTransitions,
      shareOfLoss: topCandidate.shareOfLoss,
      issueType: topCandidate.issueType,
      impactLabel: getImpactLabel(topCandidate.impactScore),
      impactScore: topCandidate.impactScore,
      impactRange,
      summary: topCandidate.keyMetric,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("SUMMARY_INSIGHT_ERROR", error);

    return NextResponse.json(
      { error: "Failed to load summary insight" },
      { status: 500 }
    );
  }
}
