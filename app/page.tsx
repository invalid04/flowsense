import Link from "next/link";

export default function Page() {
  return (
    <main className="enterprise-grid min-h-screen px-4 py-8 md:px-8 md:py-10">
      <section className="mx-auto max-w-7xl">
        <div className="glass-panel animate-rise flex items-center justify-between rounded-3xl px-6 py-5">
          <div>
            <p className="text-xl font-semibold tracking-tight text-slate-900">FlowSense</p>
            <p className="text-xs text-slate-500">Behavioral Prediction Engine</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
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
            Predictive Product Analytics
          </p>

          <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-slate-900 text-balance sm:text-6xl">
            Predict What Your Users Will Do Next
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            FlowSense turns raw event data into a predictive model of user
            behavior, helping teams uncover transition patterns, forecast next
            actions, and optimize product flows with Markov-based analytics.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="enterprise-btn inline-flex items-center justify-center px-5 py-3 text-sm"
            >
              Open Dashboard
            </Link>

            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--panel-border)] bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-900"
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-2 py-3 md:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-panel animate-rise rounded-2xl p-6" style={{ animationDelay: "80ms" }}>
            <p className="mb-3 text-sm font-semibold text-[var(--accent)]">01</p>
            <h2 className="text-xl font-semibold text-slate-900">Upload Event Data</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Import session-based event logs as CSV and transform raw behavioral
              data into structured state transitions.
            </p>
          </div>

          <div className="glass-panel animate-rise rounded-2xl p-6" style={{ animationDelay: "120ms" }}>
            <p className="mb-3 text-sm font-semibold text-[var(--accent)]">02</p>
            <h2 className="text-xl font-semibold text-slate-900">Build the Model</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              FlowSense constructs a Markov-based transition model from your
              data, mapping how users move between states across journeys.
            </p>
          </div>

          <div className="glass-panel animate-rise rounded-2xl p-6" style={{ animationDelay: "160ms" }}>
            <p className="mb-3 text-sm font-semibold text-[var(--accent)]">03</p>
            <h2 className="text-xl font-semibold text-slate-900">Explore Predictions</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Query next-state predictions, inspect confidence levels, and
              visualize transition probabilities across your product flows.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-2 py-16 md:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-panel animate-rise rounded-3xl p-8" style={{ animationDelay: "220ms" }}>
            <p className="text-sm font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
              Why teams use FlowSense
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Turn event logs into product intelligence
            </h2>
            <div className="mt-8 space-y-5 text-sm leading-6 text-slate-600">
              <p>
                Identify the most common next actions users take from key product
                states.
              </p>
              <p>
                Surface drop-off points and behavioral loops that impact
                conversion and retention.
              </p>
              <p>
                Support faster products through smarter prefetching, flow
                optimization, and user journey analysis.
              </p>
            </div>
          </div>

          <div className="glass-panel animate-rise rounded-3xl p-8" style={{ animationDelay: "280ms" }}>
            <p className="text-sm font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
              Built for real product teams
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              Predict behavior. Reduce guesswork.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="badge-kpi rounded-2xl p-5">
                <p className="text-2xl font-semibold text-slate-900">Next-State</p>
                <p className="mt-2 text-sm text-slate-500">Prediction engine</p>
              </div>
              <div className="badge-kpi rounded-2xl p-5">
                <p className="text-2xl font-semibold text-slate-900">CSV</p>
                <p className="mt-2 text-sm text-slate-500">Dataset ingestion</p>
              </div>
              <div className="badge-kpi rounded-2xl p-5">
                <p className="text-2xl font-semibold text-slate-900">Markov</p>
                <p className="mt-2 text-sm text-slate-500">Transition modeling</p>
              </div>
              <div className="badge-kpi rounded-2xl p-5">
                <p className="text-2xl font-semibold text-slate-900">Visual</p>
                <p className="mt-2 text-sm text-slate-500">
                  Analytics and charts
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-2 pb-8 pt-6 md:px-6">
        <div
          className="glass-panel animate-rise flex flex-col items-start justify-between gap-6 rounded-3xl p-8 md:flex-row md:items-center"
          style={{ animationDelay: "340ms" }}
        >
          <div>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              Ready to explore the dashboard?
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Upload a dataset, generate predictions, and visualize how users
              move through your product.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="enterprise-btn inline-flex items-center justify-center px-5 py-3 text-sm"
          >
            Launch FlowSense
          </Link>
        </div>
      </section>
    </main>
  );
}
