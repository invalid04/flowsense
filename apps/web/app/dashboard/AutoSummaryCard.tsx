"use client";

import { useEffect, useState } from "react";

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
};

function issueTone(issueType: IssueType) {
  if (issueType === "dropoff") {
    return {
      cardClass: "",
      headlineClass: "text-slate-100",
    };
  }

  return {
    cardClass: "",
    headlineClass: "text-slate-100",
  };
}

const fallbackInsight: SummaryInsight = {
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
};

export function AutoSummaryCard() {
  const [insight, setInsight] = useState<SummaryInsight>(fallbackInsight);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const res = await fetch("/api/insights/summary", { cache: "no-store" });
        const json = (await res.json()) as Partial<SummaryInsight> & { error?: string };

        if (!res.ok || json.error) {
          setInsight(fallbackInsight);
          return;
        }

        setInsight({
          headline: json.headline ?? fallbackInsight.headline,
          keyMetric: json.keyMetric ?? fallbackInsight.keyMetric,
          context: json.context ?? fallbackInsight.context,
          impact: json.impact ?? fallbackInsight.impact,
          estimatedImpact: json.estimatedImpact ?? fallbackInsight.estimatedImpact,
          recommendedAction: json.recommendedAction ?? fallbackInsight.recommendedAction,
          fromState: json.fromState ?? fallbackInsight.fromState,
          toState: json.toState ?? fallbackInsight.toState,
          transitionCount: json.transitionCount ?? fallbackInsight.transitionCount,
          nextStepCount: json.nextStepCount ?? fallbackInsight.nextStepCount,
          dropoffRate: json.dropoffRate ?? fallbackInsight.dropoffRate,
          totalTransitions: json.totalTransitions ?? fallbackInsight.totalTransitions,
          shareOfLoss: json.shareOfLoss ?? fallbackInsight.shareOfLoss,
          issueType: json.issueType ?? fallbackInsight.issueType,
        });
      } catch {
        setInsight(fallbackInsight);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const tone = issueTone(insight.issueType);
  const estimatedLiftLow = Math.round(insight.dropoffRate * 25);
  const estimatedLiftHigh = Math.max(estimatedLiftLow, Math.round(insight.dropoffRate * 50));

  return (
    <section className={["insights-feed-card insights-card-indicator animate-rise rounded-3xl p-6 md:p-8", tone.cardClass].join(" ")}>
      <p className="text-xs font-semibold tracking-[0.14em] text-slate-300 uppercase">FlowSense - Decision Output</p>
      <h2 className={["text-balance text-3xl leading-tight font-bold tracking-tight md:text-5xl", tone.headlineClass].join(" ")}>
        {loading ? "Finding your biggest conversion issue..." : insight.headline}
      </h2>

      <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-200">
        {loading ? "Analyzing transition patterns across your account." : insight.keyMetric}
      </p>

      <p className="mt-3 text-sm text-slate-300">
        {loading ? "Building funnel context." : insight.context}
      </p>

      <p className="mt-3 text-sm text-slate-200">
        {loading ? "Calculating modeled impact." : insight.impact}
      </p>

      <p className="mt-3 text-sm font-semibold text-slate-100">Estimated impact:</p>
      <p className="mt-1 text-sm text-slate-200">
        {loading ? "Calculating lift range." : `+${estimatedLiftLow}-${estimatedLiftHigh}%`}
      </p>

      <p className="mt-3 text-sm font-semibold text-slate-100">Recommended action:</p>
      <p className="mt-1 text-sm text-slate-300">
        {loading ? "Preparing recommendation." : insight.recommendedAction}
      </p>
    </section>
  );
}
