import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

const HOW_IT_WORKS_STEPS = [
  {
    title: "Instrument Your Product",
    description:
      "Install the FlowSense SDK or send events through the ingestion API using account-scoped API keys.",
  },
  {
    title: "Model User Behavior",
    description:
      "FlowSense transforms live behavioral events into transition models across sessions and journeys.",
  },
  {
    title: "Surface Actionable Insights",
    description:
      "Analyze conversion paths, drop-off points, loops, and predictions from a secure dashboard.",
  },
];

const PLATFORM_CAPABILITIES = [
  {
    title: "Developer SDK",
    description:
      "Lightweight browser SDK for automatic event tracking and session modeling.",
  },
  {
    title: "API Key Management",
    description:
      "Generate, manage, and revoke secure account-scoped API keys.",
  },
  {
    title: "Multi-Tenant Dashboard",
    description:
      "Clerk-authenticated workspace with fully isolated analytics per account.",
  },
  {
    title: "Behavioral Insights Engine",
    description: "Detect conversion paths, drop-off states, and looping behavior.",
  },
  {
    title: "Live Event Ingestion",
    description: "Stream user behavior into FlowSense in real time via API.",
  },
  {
    title: "Prediction Engine",
    description: "Query likely next actions from any current state.",
  },
];

const AUDIENCE_COLUMNS = [
  {
    title: "Product",
    description: "Understand where users succeed, stall, and drop off.",
  },
  {
    title: "Engineering",
    description: "Instrument flows quickly with SDK and API keys.",
  },
  {
    title: "Growth",
    description:
      "Use predictive data to improve conversion and reduce friction.",
  },
];

export default async function Page() {
  const { userId } = await auth();
  const dashboardHref = userId ? "/dashboard" : "/sign-in";
  const publicAppUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com").replace(
    /\/+$/,
    ""
  );
  const quickstartSnippet = `<script src="${publicAppUrl}/flowsense-sdk.js"></script>
<script>
  FlowSense.init({
    apiKey: "fs_live_xxx",
    endpoint: "${publicAppUrl}/api/ingest"
  });

  FlowSense.track("/home");
</script>`;

  return (
    <main className="enterprise-grid min-h-screen px-4 py-8 md:px-8 md:py-10">
      <section className="mx-auto max-w-7xl">
        <div className="glass-panel animate-rise flex items-center justify-between rounded-3xl px-6 py-5">
          <div>
            <p className="text-xl font-semibold tracking-tight text-slate-900">FlowSense</p>
            <p className="text-xs text-slate-500">Developer-First Behavioral Intelligence</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={dashboardHref}
              className="enterprise-btn inline-flex items-center justify-center px-4 py-2 text-sm"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-2 py-14 md:px-6 md:py-20">
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
            Behavioral Analytics Platform
          </p>

          <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-slate-900 text-balance sm:text-6xl">
            Behavioral Intelligence for Modern Product Teams
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Track user flows, generate predictive insights, and power behavioral analytics through
            a developer-first platform built on Markov-based modeling.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href={dashboardHref}
              className="enterprise-btn inline-flex items-center justify-center px-5 py-3 text-sm"
            >
              Open Dashboard
            </Link>

            <a
              href="#developer-platform"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--panel-border)] bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-900"
            >
              View Developer Platform
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-2 py-3 md:px-6">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
            How It Works
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <div
              key={step.title}
              className="glass-panel animate-rise rounded-2xl p-6"
              style={{ animationDelay: `${80 + index * 40}ms` }}
            >
              <p className="mb-3 text-sm font-semibold text-[var(--accent)]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="text-xl font-semibold text-slate-900">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="developer-platform" className="mx-auto max-w-7xl px-2 py-16 md:px-6">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
            Platform Capabilities
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            Developer Platform for Behavioral Intelligence
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PLATFORM_CAPABILITIES.map((capability, index) => (
            <article
              key={capability.title}
              className="glass-panel animate-rise rounded-2xl p-6"
              style={{ animationDelay: `${220 + index * 35}ms` }}
            >
              <h3 className="text-lg font-semibold text-slate-900">{capability.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{capability.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-2 py-4 md:px-6">
        <div className="glass-panel animate-rise rounded-3xl p-8" style={{ animationDelay: "350ms" }}>
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
            Product Preview
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            A Full Behavioral Analytics Workspace
          </h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
            Monitor conversion behavior, identify churn points, inspect loop patterns, manage
            developer access, and explore product flow intelligence from a unified dashboard.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="badge-kpi rounded-2xl p-5">
              <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
                Conversion Intelligence
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Trace high-value journeys and breakpoints across user states.
              </p>
            </div>
            <div className="badge-kpi rounded-2xl p-5">
              <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
                Predictive Analysis
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Inspect likely next actions from any point in a session.
              </p>
            </div>
            <div className="badge-kpi rounded-2xl p-5">
              <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
                Access and Workspace
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Secure account isolation with API key lifecycle controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-2 py-16 md:px-6">
        <div className="glass-panel animate-rise rounded-3xl p-8" style={{ animationDelay: "380ms" }}>
          <p className="text-sm font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
            Developer Quickstart
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            Instrument in Minutes with SDK + API
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Drop in one script, initialize with your API key, and start streaming behavioral events
            to your account-scoped ingestion endpoint.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-2xl border border-[var(--panel-border)] bg-slate-950/95 p-5 text-sm leading-6 text-slate-100">
            <code>{quickstartSnippet}</code>
          </pre>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-2 py-2 md:px-6">
        <div className="mb-8 max-w-4xl">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
            Built for Product, Engineering, and Growth Teams
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {AUDIENCE_COLUMNS.map((column, index) => (
            <article
              key={column.title}
              className="glass-panel animate-rise rounded-2xl p-6"
              style={{ animationDelay: `${430 + index * 30}ms` }}
            >
              <h3 className="text-xl font-semibold text-slate-900">{column.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{column.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-2 pb-8 pt-6 md:px-6">
        <div
          className="glass-panel animate-rise flex flex-col items-start justify-between gap-6 rounded-3xl p-8 md:flex-row md:items-center"
          style={{ animationDelay: "500ms" }}
        >
          <div>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              From Event Tracking to Product Intelligence
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Capture behavioral data, model user journeys, and turn product usage into actionable
              insight with FlowSense.
            </p>
          </div>

          <Link
            href={dashboardHref}
            className="enterprise-btn inline-flex items-center justify-center px-5 py-3 text-sm"
          >
            Launch FlowSense
          </Link>
        </div>
      </section>
    </main>
  );
}
