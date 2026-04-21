export type InsightInput = {
  fromState: string;
  toState: string;
  transitionCount: number;
  nextStepCount: number;
  totalDropoffs: number;
  totalTransitions: number;
  headline?: string;
  keyMetric?: string;
  context?: string;
  impact?: string;
  estimatedImpact?: string;
  action?: string;
};

export type InsightMetrics = {
  fromState: string;
  toState: string;
  transitionCount: number;
  nextStepCount: number;
  dropoffCount: number;
  dropoffRate: number;
  totalDropoffs: number;
  totalTransitions: number;
  shareOfLoss: number;
  estimatedLiftLow: number;
  estimatedLiftHigh: number;
};

export type StructuredInsightText = InsightMetrics & {
  headline: string;
  keyMetric: string;
  context: string;
  impact: string;
  estimatedImpact: string;
  recommendedAction: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function percent(value: number) {
  return Math.round(value * 100);
}

export function buildInsightText(input: InsightInput): StructuredInsightText {
  const transitionCount = Math.max(0, Math.round(input.transitionCount));
  const nextStepCount = clamp(Math.round(input.nextStepCount), 0, transitionCount);
  const totalDropoffs = Math.max(0, Math.round(input.totalDropoffs));
  const totalTransitions = Math.max(0, Math.round(input.totalTransitions));
  const dropoffCount = Math.max(0, transitionCount - nextStepCount);
  const dropoffRate = transitionCount > 0 ? 1 - nextStepCount / transitionCount : 0;
  const shareOfLoss = totalDropoffs > 0 ? dropoffCount / totalDropoffs : 0;

  const estimatedLiftLow = percent(dropoffRate * 0.25);
  const estimatedLiftHigh = Math.max(estimatedLiftLow, percent(dropoffRate * 0.5));
  const dropoffRatePct = percent(dropoffRate);
  const shareOfLossPct = percent(shareOfLoss);

  const fromState = input.fromState;
  const toState = input.toState;

  return {
    fromState,
    toState,
    transitionCount,
    nextStepCount,
    dropoffCount,
    dropoffRate,
    totalDropoffs,
    totalTransitions,
    shareOfLoss,
    estimatedLiftLow,
    estimatedLiftHigh,
    headline: input.headline ?? `${toState} is your largest drop-off point`,
    keyMetric:
      input.keyMetric ??
      `${dropoffRatePct}% of users exit at ${toState} (${transitionCount} -> ${nextStepCount} sessions).`,
    context:
      input.context ??
      `This transition (${fromState} -> ${toState}) is a critical step in your primary conversion path.`,
    impact:
      input.impact ??
      `This step accounts for ${shareOfLossPct}% of total funnel loss across ${totalTransitions.toLocaleString()} modeled transitions.`,
    estimatedImpact:
      input.estimatedImpact ??
      `Improving this step could increase conversions by +${estimatedLiftLow}-${estimatedLiftHigh}%.`,
    recommendedAction:
      input.action ?? "Reduce friction, simplify UX, and reinforce the next action.",
  };
}
