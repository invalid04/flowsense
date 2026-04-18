import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getBaseUrl } from "@/lib/getBaseUrl";

const SIGNAL_METRICS = [
  { label: "Conversion Rate", value: "17.4%", detail: "Across tracked funnels" },
  { label: "Drop-off Risk", value: "28.6%", detail: "Highest-risk step" },
  { label: "Biggest Opportunity", value: "Checkout", detail: "Largest recoverable loss" },
];

const CONTROL_MODULES = [
  {
    name: "Behavior Engine",
    description: "Markov-based path modeling that isolates where intent weakens.",
    status: "Live",
  },
  {
    name: "Conversion Risk Radar",
    description: "Flags the exact handoffs where users abandon before converting.",
    status: "Monitoring",
  },
  {
    name: "Top Growth Actions",
    description: "Turns journey friction into prioritized, fix-first recommendations.",
    status: "Ready",
  },
  {
    name: "Opportunity Tracker",
    description: "Tracks resolved issues and surfaces the next highest-impact fix.",
    status: "Active",
  },
];

const OPERATING_SYSTEM = [
  {
    title: "Tracking",
    body: "SDK + API ingestion captures account-scoped user journeys in real time.",
  },
  {
    title: "Behavior Engine",
    body: "Transition probabilities map intent decay and conversion momentum.",
  },
  {
    title: "Recommendations",
    body: "Action-first guidance ranks what to fix first to lift conversions.",
  },
];

const PLAN_LIMITS = [
  "Events per month",
  "Projects per workspace",
  "Insights depth and recommendation history",
];

export default async function Page() {
  const { userId } = await auth();
  const dashboardHref = userId ? "/dashboard" : "/sign-in";
  const publicAppUrl = getBaseUrl();

  const quickstartSnippet = `<script src="${publicAppUrl}/flowsense-sdk.js"></script>
<script>
  FlowSense.init({
    apiKey: "fs_live_xxx",
    endpoint: "${publicAppUrl}/api/ingest"
  });

  FlowSense.track("/home");
</script>`;

  return (
    <main className="insights-workspace min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-5">
        <header className="insights-shell animate-rise rounded-2xl p-4 md:p-5" style={{ animationDelay: "40ms" }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-500/40 bg-black/55 text-slate-200">
                <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                  <path
                    d="M3 13h4l2-5 3 9 2-5h7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <p className="font-mono text-[0.72rem] tracking-[0.2em] text-slate-400 uppercase">FlowSense</p>
                <p className="text-sm text-slate-300">Growth Intelligence Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="#quickstart"
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-600/80 bg-black/30 px-4 text-sm font-medium text-slate-200 transition hover:border-slate-400 hover:text-slate-100"
              >
                Connect Data
              </a>
              <Link
                href={dashboardHref}
                className="inline-flex min-h-10 items-center rounded-lg border border-slate-500/80 bg-slate-100 px-4 text-sm font-semibold text-black transition hover:bg-slate-200"
              >
                Open Dashboard
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="insights-shell animate-rise rounded-3xl p-6 md:p-8" style={{ animationDelay: "90ms" }}>
            <p className="font-mono text-xs tracking-[0.2em] text-slate-300 uppercase">Conversion Optimization Engine</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
              Find What&apos;s Killing Your Conversions and Fix It
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              FlowSense analyzes how users move through your product and tells you exactly where they
              drop off, why it matters, and what to do next.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {SIGNAL_METRICS.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-slate-700/90 bg-black/30 p-4">
                  <p className="font-mono text-[0.65rem] tracking-[0.14em] text-slate-400 uppercase">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-100">{metric.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{metric.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="insights-shell animate-rise rounded-3xl p-6 md:p-8" style={{ animationDelay: "130ms" }}>
            <p className="font-mono text-xs tracking-[0.2em] text-slate-300 uppercase">Decision Layer</p>
            <div className="mt-4 space-y-3">
              {OPERATING_SYSTEM.map((item, index) => (
                <div key={item.title} className="rounded-xl border border-slate-700/80 bg-black/25 p-4">
                  <p className="font-mono text-[0.68rem] tracking-[0.14em] text-slate-400 uppercase">
                    0{index + 1} {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-6 gap-2">
              {Array.from({ length: 18 }, (_, index) => (
                <div
                  key={`cell-${index}`}
                  className={`h-5 rounded-sm border ${
                    index % 4 === 0
                      ? "border-slate-500/70 bg-slate-400/30"
                      : "border-slate-700/90 bg-slate-900/75"
                  }`}
                />
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CONTROL_MODULES.map((module, index) => (
            <article
              key={module.name}
              className="insights-feed-card animate-rise p-5"
              style={{ animationDelay: `${160 + index * 35}ms` }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs tracking-[0.12em] text-slate-300 uppercase">{module.name}</p>
                <span className="rounded-full border border-slate-500/60 bg-slate-500/15 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-200 uppercase">
                  {module.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{module.description}</p>
            </article>
          ))}
        </section>

        <section
          id="quickstart"
          className="insights-surface animate-rise rounded-3xl border border-slate-700/70 p-6 md:p-8"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="font-mono text-xs tracking-[0.2em] text-slate-400 uppercase">Developer Quickstart</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">
                Start tracking and uncover your biggest conversion issues in minutes
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Drop in one script, initialize with your API key, and capture the journeys behind your
                growth opportunities.
              </p>
              <div className="mt-6">
                <Link
                  href={dashboardHref}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-500/80 bg-slate-100 px-5 text-sm font-semibold text-black transition hover:bg-slate-200"
                >
                  Launch Workspace
                </Link>
              </div>
            </div>

            <pre className="w-full max-w-2xl overflow-x-auto rounded-2xl border border-slate-700 bg-black/85 p-4 text-xs leading-6 text-slate-100 md:text-sm">
              <code>{quickstartSnippet}</code>
            </pre>
          </div>
        </section>

        <section className="insights-surface animate-rise rounded-3xl border border-slate-700/70 p-6 md:p-8" style={{ animationDelay: "340ms" }}>
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <p className="font-mono text-xs tracking-[0.2em] text-slate-400 uppercase">Monetization Ready</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">
                Clear packaging for indie SaaS teams
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Offer a free plan for one project and a paid plan for full insights + predictions.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-black/40 px-4 py-3 text-sm text-slate-200">
              <p className="font-semibold text-slate-100">Example pricing</p>
              <p className="mt-1">Free: 1 project, limited events</p>
              <p>$15/mo: full insights + predictions</p>
            </div>
          </div>

          <ul className="mt-5 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
            {PLAN_LIMITS.map((limit) => (
              <li key={limit} className="rounded-xl border border-slate-700/80 bg-black/30 px-3 py-2">
                {limit}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
