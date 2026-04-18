"use client";

import { useEffect, useState } from "react";

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

function issueTone(issueType: IssueType) {
  if (issueType === "dropoff") {
    return {
      cardClass: "insights-feed-card--dropoff",
      headlineClass: "text-orange-100",
    };
  }

  if (issueType === "loop") {
    return {
      cardClass: "insights-feed-card--loop",
      headlineClass: "text-violet-100",
    };
  }

  if (issueType === "strong_path") {
    return {
      cardClass: "insights-feed-card--success",
      headlineClass: "text-emerald-100",
    };
  }

  return {
    cardClass: "",
    headlineClass: "text-slate-100",
  };
}

function impactLine(insight: SummaryInsight) {
  if (insight.issueType === "dropoff") {
    return `${insight.impactLabel} - fixing this could improve conversions by ~${insight.impactRange}`;
  }

  if (insight.issueType === "loop") {
    return `${insight.impactLabel} - reducing this friction could improve progression by ~${insight.impactRange}`;
  }

  if (insight.issueType === "strong_path") {
    return `${insight.impactLabel} - amplifying this path could improve conversions by ~${insight.impactRange}`;
  }

  return `${insight.impactLabel} - connect your data to generate an actionable lift range.`;
}

const fallbackInsight: SummaryInsight = {
  headline: "No modeled behavior yet",
  summary: "Track events or upload data to generate your first summary.",
  impactLabel: "Low Impact",
  impactScore: 0,
  impactRange: "0-0%",
  recommendedAction: "Connect your product data and begin collecting transitions.",
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
          summary: json.summary ?? fallbackInsight.summary,
          impactLabel: json.impactLabel ?? fallbackInsight.impactLabel,
          impactScore: json.impactScore ?? fallbackInsight.impactScore,
          impactRange: json.impactRange ?? fallbackInsight.impactRange,
          recommendedAction: json.recommendedAction ?? fallbackInsight.recommendedAction,
          issueType: json.issueType ?? fallbackInsight.issueType,
          supportingState: json.supportingState,
          supportingMetric: json.supportingMetric,
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

  return (
    <section className={["insights-feed-card animate-rise rounded-3xl p-6 md:p-8", tone.cardClass].join(" ")}>
      <h2 className={["text-balance text-3xl leading-tight font-bold tracking-tight md:text-5xl", tone.headlineClass].join(" ")}>
        {loading ? "Finding your biggest conversion issue..." : insight.headline}
      </h2>

      <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-200">{loading ? "Analyzing transition patterns across your account." : insight.summary}</p>

      <p className="mt-5 text-sm font-semibold text-slate-100">{loading ? "Impact - calculating potential lift" : impactLine(insight)}</p>

      <p className="mt-3 text-sm text-slate-300">
        <span className="font-semibold text-slate-100">Recommended action: </span>
        {loading ? "Preparing recommendation." : insight.recommendedAction}
      </p>
    </section>
  );
}
