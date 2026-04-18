import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getBaseUrl } from "@/lib/getBaseUrl";
import { FlowSenseLogo } from "@/app/components/FlowSenseLogo";

const SIGNAL_METRICS = [
  { label: "Overall Conversion", value: "17.4%", detail: "Most users drop before checkout" },
  { label: "Biggest Drop-off", value: "Checkout", detail: "Highest friction point" },
  { label: "Highest Impact Fix", value: "Billing Step", detail: "Largest recoverable loss" },
];

const CONTROL_MODULES = [
  {
    name: "User Flow Modeling",
    description: "Models user paths. Identifies where intent weakens.",
  },
  {
    name: "Drop-off Detection",
    description: "Detects hesitation points. Flags exact drop-off transitions.",
  },
  {
    name: "Fix Priorities",
    description: "Ranks highest-impact fixes. Outputs action order.",
    primary: true,
  },
  {
    name: "Next Best Action",
    description: "Tracks resolved friction. Surfaces the next action.",
  },
];

const OPERATING_SYSTEM = [
  {
    title: "Capture",
    body: "Records real user journeys in real time.",
  },
  {
    title: "Detect",
    body: "Identifies hesitation and drop-off points.",
  },
  {
    title: "Output",
    body: "Ranks what to fix first to improve conversions.",
  },
];

const PLAN_LIMITS = ["Events per month", "Projects per workspace", "Insights depth and recommendation history"];

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
    <main className="insights-workspace landing-workspace min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-5">
        <header className="insights-shell animate-rise rounded-2xl p-4 md:p-5" style={{ animationDelay: "40ms" }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="group/logo flex items-center gap-3 text-slate-100">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700/80 bg-black/30">
                <FlowSenseLogo className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-[0.72rem] tracking-[0.2em] text-slate-400 uppercase">FlowSense</p>
                <p className="text-sm text-slate-300">Conversion Intelligence Console</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={dashboardHref}
                className="inline-flex min-h-10 items-center rounded-lg border border-slate-500/80 bg-slate-100 px-4 text-sm font-semibold text-black transition hover:bg-slate-200"
              >
                Start Tracking Free
              </Link>
              <Link
                href="/sdk-demo"
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-600/80 bg-black/30 px-4 text-sm font-medium text-slate-200 transition hover:border-slate-400 hover:text-slate-100"
              >
                View Demo
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="insights-shell animate-rise rounded-3xl p-6 md:p-8" style={{ animationDelay: "90ms" }}>
            <p className="font-mono text-xs tracking-[0.2em] text-slate-300 uppercase">
              FLOWSENSE {"\u2014"} CONVERSION INTELLIGENCE SYSTEM
            </p>
            <p className="mt-4 text-sm text-slate-300">Designed for product teams who want to move faster</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
              Stop guessing why users drop off. See exactly where you&apos;re losing conversions.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              Detect friction. Understand behavior. Fix what matters {"\u2014"} instantly.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={dashboardHref}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-500/80 bg-slate-100 px-5 text-sm font-semibold text-black transition hover:bg-slate-200"
              >
                Start Tracking Free
              </Link>
              <Link
                href="/sdk-demo"
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-600/80 bg-black/30 px-5 text-sm font-medium text-slate-200 transition hover:border-slate-400 hover:text-slate-100"
              >
                View Demo
              </Link>
            </div>
            <p className="mt-2 text-xs text-slate-400">No setup friction. Start in minutes.</p>

            <div className="mt-6 rounded-xl border border-slate-700/80 bg-black/20 p-3.5">
              <p className="text-sm leading-6 text-slate-200">
                Most users never convert. They hesitate, loop, and drop off before completing key actions.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                FlowSense shows exactly where this happens {"\u2014"} and what to fix.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {SIGNAL_METRICS.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-slate-700/90 bg-black/30 p-4">
                  <p className="text-2xl font-semibold text-slate-100">{metric.value}</p>
                  <p className="mt-2 font-mono text-[0.65rem] tracking-[0.14em] text-slate-300 uppercase">{metric.label}</p>
                  <p className="mt-2 text-xs text-slate-400">{metric.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article
            className="insights-shell insights-shell--strong animate-rise rounded-3xl p-6 md:p-8 lg:translate-x-2"
            style={{ animationDelay: "130ms" }}
          >
            <p className="font-mono text-xs tracking-[0.2em] text-slate-100 uppercase">How It Works</p>
            <div className="mt-4 space-y-4">
              {OPERATING_SYSTEM.map((item, index) => (
                <div key={item.title} className="rounded-xl border border-slate-600/90 bg-black/25 p-5">
                  <p className="font-mono text-[0.68rem] font-semibold tracking-[0.16em] text-slate-200 uppercase">
                    0{index + 1} {"\u2014"} {item.title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-200">{item.body}</p>
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

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 xl:-translate-x-1">
          {CONTROL_MODULES.map((module, index) => (
            <article
              key={module.name}
              className={`insights-feed-card animate-rise p-4 ${module.primary ? "insights-feed-card--primary md:scale-[1.02]" : ""} ${
                index % 2 === 0 ? "md:translate-y-0.5" : ""
              }`}
              style={{ animationDelay: `${160 + index * 35}ms` }}
            >
              <p
                className={`font-mono text-xs tracking-[0.12em] uppercase ${
                  module.primary ? "font-semibold text-slate-100" : "text-slate-300"
                }`}
              >
                {module.name}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{module.description}</p>
            </article>
          ))}
        </section>

        <section
          id="quickstart"
          className="insights-surface animate-rise rounded-3xl border border-slate-700/70 p-6 md:p-8 lg:-translate-x-1"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="font-mono text-xs tracking-[0.2em] text-slate-400 uppercase">Developer Quickstart</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">
                Initialize tracking. Capture real user behavior in minutes.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Install the SDK. Initialize with your API key. Begin capturing behavior immediately.
              </p>
              <div className="mt-6">
                <Link
                  href={dashboardHref}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-500/80 bg-slate-100 px-5 text-sm font-semibold text-black transition hover:bg-slate-200"
                >
                  Start Tracking Free
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
              <p className="font-mono text-xs tracking-[0.2em] text-slate-400 uppercase">Access Tiers</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">
                Simple pricing {"\u2014"} start free, scale as you grow
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Free gets one project and limited events. Paid unlocks full insights plus predictions.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-black/40 px-4 py-3 text-sm text-slate-200">
              <p className="font-semibold text-slate-100">Free {"\u2014"} Single Project Access</p>
              <p className="mt-1 text-slate-300">Limited events. Core system functionality.</p>
              <p className="mt-3 font-semibold text-slate-100">$15/mo {"\u2014"} Full System Access</p>
              <p className="mt-1 text-slate-300">Unlimited insights. Predictions. Priority actions.</p>
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
