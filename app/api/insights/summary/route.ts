import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { states, transitions } from "@/db/schema";
import { UnauthorizedError, getOrCreateAccount } from "@/lib/getOrCreateAccount";

type IssueType = "dropoff" | "loop" | "strong_path" | "empty";

type SummaryInsight = {
  headline: string;
  summary: string;
  impactLabel: "High Impact" | "Medium Impact" | "Low Impact";
  impactScore: number;
  impactRange: string;
  recommendedAction: string;
  issueType: IssueType;
  supportingState?: string;
  supportingMetric?: string;
};

type CandidateInsight = SummaryInsight & {
  issuePercentage: number;
};

function toPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return (value / total) * 100;
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function formatPercent(value: number) {
  return `${roundToSingleDecimal(value).toFixed(1)}%`;
}

function getTrafficWeight(percentage: number) {
  if (percentage >= 20) return 1;
  if (percentage >= 10) return 0.8;
  return 0.6;
}

function getImpactLabel(impactScore: number): SummaryInsight["impactLabel"] {
  if (impactScore >= 18) return "High Impact";
  if (impactScore >= 9) return "Medium Impact";
  return "Low Impact";
}

function buildImpactRange(issuePercentage: number) {
  const low = Math.max(0, Math.floor(issuePercentage * 0.4));
  const high = Math.max(low, Math.ceil(issuePercentage * 0.7));

  return `${low}-${high}%`;
}

function scoreCandidate(percentage: number, positionWeight: number) {
  const impactScore = percentage * getTrafficWeight(percentage) * positionWeight;

  return roundToSingleDecimal(impactScore);
}

function buildEmptySummary(): SummaryInsight {
  return {
    headline: "No modeled behavior yet",
    summary: "Track events or upload data to generate your first summary.",
    impactLabel: "Low Impact",
    impactScore: 0,
    impactRange: "0-0%",
    recommendedAction: "Connect your product data and begin collecting transitions.",
    issueType: "empty",
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

    const incomingByState = new Map<string, number>();
    const outgoingByState = new Map<string, number>();
    const edgeCountByKey = new Map<string, number>();

    for (const transition of accountTransitions) {
      const count = Number(transition.count);

      incomingByState.set(
        transition.toStateId,
        (incomingByState.get(transition.toStateId) ?? 0) + count
      );
      outgoingByState.set(
        transition.fromStateId,
        (outgoingByState.get(transition.fromStateId) ?? 0) + count
      );

      const edgeKey = `${transition.fromStateId}->${transition.toStateId}`;
      edgeCountByKey.set(edgeKey, (edgeCountByKey.get(edgeKey) ?? 0) + count);
    }

    const candidates: CandidateInsight[] = [];

    for (const [stateId, incomingCount] of incomingByState.entries()) {
      const outgoingCount = outgoingByState.get(stateId) ?? 0;
      if (incomingCount <= 0 || outgoingCount > 0) {
        continue;
      }

      const stateName = stateNameById.get(stateId) ?? "Unknown step";
      const percentage = toPercent(incomingCount, totalTransitions);
      const impactScore = scoreCandidate(percentage, 0.7);

      candidates.push({
        headline: `${stateName} is the biggest leak in your funnel`,
        summary: `${formatPercent(percentage)} of modeled traffic exits at ${stateName}.`,
        impactLabel: getImpactLabel(impactScore),
        impactScore,
        impactRange: buildImpactRange(percentage),
        recommendedAction: `Reduce friction at ${stateName} and test a shorter completion flow.`,
        issueType: "dropoff",
        supportingState: stateName,
        supportingMetric: `${formatPercent(percentage)} of modeled traffic exits here`,
        issuePercentage: percentage,
      });
    }

    const visitedLoopPairs = new Set<string>();

    for (const [edgeKey, forwardCount] of edgeCountByKey.entries()) {
      const [fromStateId, toStateId] = edgeKey.split("->");

      if (!fromStateId || !toStateId || fromStateId === toStateId) {
        continue;
      }

      const reverseKey = `${toStateId}->${fromStateId}`;
      const reverseCount = edgeCountByKey.get(reverseKey);

      if (!reverseCount) {
        continue;
      }

      const pairKey = [fromStateId, toStateId].sort().join("<->");
      if (visitedLoopPairs.has(pairKey)) {
        continue;
      }
      visitedLoopPairs.add(pairKey);

      const fromStateName = stateNameById.get(fromStateId) ?? "Unknown step";
      const toStateName = stateNameById.get(toStateId) ?? "Unknown step";
      const combinedLoopCount = forwardCount + reverseCount;
      const percentage = toPercent(combinedLoopCount, totalTransitions);
      const impactScore = scoreCandidate(percentage, 0.8);

      candidates.push({
        headline: "Users are getting stuck deciding",
        summary: `${formatPercent(percentage)} of transitions loop between ${fromStateName} and ${toStateName}.`,
        impactLabel: getImpactLabel(impactScore),
        impactScore,
        impactRange: buildImpactRange(percentage),
        recommendedAction: `Clarify the choice between ${fromStateName} and ${toStateName} with clearer messaging and one primary next step.`,
        issueType: "loop",
        supportingState: `${fromStateName} <-> ${toStateName}`,
        supportingMetric: `${formatPercent(percentage)} of transitions are caught in this loop`,
        issuePercentage: percentage,
      });
    }

    let strongestEdge:
      | {
          fromStateId: string;
          toStateId: string;
          count: number;
        }
      | null = null;

    for (const [edgeKey, count] of edgeCountByKey.entries()) {
      if (!strongestEdge || count > strongestEdge.count) {
        const [fromStateId, toStateId] = edgeKey.split("->");
        if (!fromStateId || !toStateId) {
          continue;
        }

        strongestEdge = {
          fromStateId,
          toStateId,
          count,
        };
      }
    }

    if (strongestEdge) {
      const fromStateName =
        stateNameById.get(strongestEdge.fromStateId) ?? "Unknown step";
      const toStateName =
        stateNameById.get(strongestEdge.toStateId) ?? "Unknown step";
      const percentage = toPercent(strongestEdge.count, totalTransitions);

      let positionWeight = 0.8;
      const fromStateIncoming = incomingByState.get(strongestEdge.fromStateId) ?? 0;
      const toStateOutgoing = outgoingByState.get(strongestEdge.toStateId) ?? 0;

      if (fromStateIncoming === 0) {
        positionWeight = 1;
      } else if (toStateOutgoing === 0) {
        positionWeight = 0.6;
      }

      const impactScore = scoreCandidate(percentage, positionWeight);

      candidates.push({
        headline: "You have one path that outperforms the rest",
        summary: `${formatPercent(percentage)} of modeled traffic moves from ${fromStateName} to ${toStateName}.`,
        impactLabel: getImpactLabel(impactScore),
        impactScore,
        impactRange: buildImpactRange(percentage),
        recommendedAction: `Drive more users into ${fromStateName} and replicate what makes the ${fromStateName} -> ${toStateName} transition work.`,
        issueType: "strong_path",
        supportingState: `${fromStateName} -> ${toStateName}`,
        supportingMetric: `${formatPercent(percentage)} of modeled traffic follows this path`,
        issuePercentage: percentage,
      });
    }

    if (candidates.length === 0) {
      return NextResponse.json(buildEmptySummary());
    }

    candidates.sort((a, b) => b.impactScore - a.impactScore);
    const topCandidate = candidates[0];

    return NextResponse.json({
      headline: topCandidate.headline,
      summary: topCandidate.summary,
      impactLabel: topCandidate.impactLabel,
      impactScore: topCandidate.impactScore,
      impactRange: topCandidate.impactRange,
      recommendedAction: topCandidate.recommendedAction,
      issueType: topCandidate.issueType,
      supportingState: topCandidate.supportingState,
      supportingMetric: topCandidate.supportingMetric,
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
