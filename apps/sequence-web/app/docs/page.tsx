const pipeline = [
  {
    id: "01",
    title: "Observation Layer",
    detail: "Captures ordered behavioral state transitions across systems.",
  },
  {
    id: "02",
    title: "Prediction Engine",
    detail: "Computes probable next-state branches with live confidence.",
  },
  {
    id: "03",
    title: "Action Runtime",
    detail: "Emits intervention events when policy thresholds are reached.",
  },
  {
    id: "04",
    title: "Continuous Evaluation",
    detail: "Evaluates behavior continuously and emits actions in real time.",
  },
];

export default function DocsPage() {
  return (
    <div className="page-shell">
      <div className="content-container">
        <header className="flex items-center justify-between py-6">
          <a
            href="/"
            className="group inline-flex items-center gap-3.5 text-[14px] font-medium tracking-[0.44em] leading-none text-foreground"
            aria-label="Sequence"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-foreground/90" />
              <span className="h-px w-5 bg-foreground/60" />
              <span className="size-1.5 rounded-full bg-foreground/90" />
            </span>
            <span className="text-[13px] font-normal tracking-[0.5em]">SEQUENCE</span>
          </a>
          <nav className="hidden items-center gap-11 text-[11px] tech-label text-[#bdbdbd] md:flex">
            <a className="transition-colors hover:text-foreground" href="/">
              Product
            </a>
            <a className="text-foreground" href="/docs" aria-current="page">
              Docs
            </a>
            <a className="transition-colors hover:text-foreground" href="#">
              API
            </a>
            <a
              className="button-group inline-flex h-11 items-center gap-2 rounded-[4px] border border-divider-strong px-5 text-[11px] tracking-[0.16em] text-foreground transition-colors hover:border-foreground/50"
              href="#"
            >
              Open Console
              <span className="button-arrow text-[13px]">→</span>
            </a>
          </nav>
          <button
            type="button"
            className="inline-flex h-10 items-center rounded-[4px] border border-divider px-3 tech-label text-[10px] text-foreground/75 md:hidden"
          >
            Menu
          </button>
        </header>

        <main className="pb-16 md:pb-20">
          <section className="border-y border-divider py-10 md:py-12">
            <p className="tech-label text-[10px] text-text-tertiary">Field Manual / Docs</p>
            <h1 className="mt-5 max-w-[980px] text-[42px] leading-[1.02] tracking-[-0.02em] text-foreground sm:text-[56px] lg:text-[72px]">
              Behavior Prediction Infrastructure
            </h1>
            <p className="mt-8 max-w-[900px] text-[20px] leading-[1.42] text-text-secondary sm:text-[24px]">
              Sequence tracks behavior, predicts what happens next, and emits actions in real time.
              <br />
              Integrate once. Operate continuously.
            </p>
          </section>

          <section className="border-b border-divider">
            <div className="grid divide-y divide-divider py-6 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
              {pipeline.map((item) => (
                <article key={item.id} className="px-6 py-8 lg:px-7">
                  <p className="tech-label text-[11px] text-[#6a6a6a]">
                    {item.id} / {item.title.toUpperCase()}
                  </p>
                  <h2 className="mt-4 text-[20px] font-medium leading-[1.24] tracking-[-0.01em] text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-4 text-[16px] leading-[1.62] text-text-body-muted">{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="py-14 md:py-16">
            <div className="flex items-center justify-between">
              <p className="tech-label text-[10px] text-text-tertiary">Signal Topology</p>
              <p className="tech-label signal-dots text-[10px] text-text-tertiary">
                live model state / 2,491 active sequences
              </p>
            </div>
            <div className="mt-7 rounded-[6px] border border-divider bg-[#0d0d0d] p-4 md:p-6">
              <svg viewBox="0 0 1200 300" className="h-auto w-full" role="img" aria-label="Behavior transition graph">
                <defs>
                  <linearGradient id="trace" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
                    <stop offset="55%" stopColor="rgba(255,255,255,0.6)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.14)" />
                  </linearGradient>
                </defs>
                <path
                  d="M80 150 C 210 150, 250 84, 370 84 S 560 134, 670 134 S 860 92, 1010 92"
                  fill="none"
                  stroke="url(#trace)"
                  strokeWidth="2"
                  className="trace-flow"
                />
                <path
                  d="M80 150 C 210 150, 250 226, 370 226 S 560 178, 670 178 S 860 230, 1010 230"
                  fill="none"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="1.4"
                  strokeDasharray="4 6"
                />
                <path
                  d="M370 84 C 470 84, 520 50, 640 50 S 850 66, 1010 66"
                  fill="none"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="1.2"
                  strokeDasharray="3 7"
                />
                {[
                  [80, 150, 4.4],
                  [370, 84, 4],
                  [370, 226, 4],
                  [670, 134, 4.8],
                  [670, 178, 3.8],
                  [1010, 92, 5],
                  [1010, 230, 4.2],
                ].map(([x, y, r], i) => (
                  <circle key={i} cx={x} cy={y} r={r} fill="rgba(255,255,255,0.76)" />
                ))}
              </svg>
            </div>
          </section>

          <section className="grid gap-10 py-12 md:py-14 lg:grid-cols-[0.84fr_1.16fr] lg:gap-14">
            <div>
              <p className="tech-label text-[10px] text-text-tertiary">Quickstart</p>
              <h2 className="mt-4 text-[32px] leading-[1.08] tracking-[-0.02em] text-foreground sm:text-[40px]">
                Behavior becomes infrastructure.
              </h2>
              <p className="mt-5 max-w-[620px] text-[17px] leading-[1.62] text-text-secondary">
                Initialize. Identify. Track.
                <br />
                Subscribe to actions.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <a
                  className="button-group inline-flex h-11 items-center gap-2 rounded-[4px] border border-divider-strong bg-surface-soft px-5 text-[11px] tech-label text-foreground transition-colors hover:border-foreground/56"
                  href="#"
                >
                  View API Reference
                  <span className="button-arrow text-[13px]">→</span>
                </a>
                <a
                  className="button-group inline-flex items-center gap-2 text-[11px] tech-label text-foreground/80 transition-colors hover:text-foreground"
                  href="#"
                >
                  Run Sandbox
                  <span className="button-arrow text-[12px]">▶</span>
                </a>
              </div>
            </div>

            <div className="terminal-shell relative overflow-hidden rounded-[6px] border border-divider bg-[#0f0f0f]">
              <div className="relative z-10 flex items-center justify-between border-b border-divider px-4 py-3">
                <div className="inline-flex items-center gap-2 tech-label text-[10px] text-text-tertiary">
                  <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-foreground/90" />
                  sequence.ts
                </div>
                <p className="tech-label signal-dots text-[9px] text-text-tertiary">runtime online</p>
              </div>
              <pre className="relative z-10 min-h-[460px] overflow-x-auto px-5 py-5 text-[14px] leading-[1.74] text-[#d2d2d2] md:text-[15px]">
                <code>{`import { Sequence } from "@sequence/sdk";

const sequence = new Sequence({
  apiKey: process.env.NEXT_PUBLIC_SEQUENCE_KEY!,
});

sequence.identify("acct_1420", {
  plan: "enterprise",
  region: "us-central",
});

sequence.track("checkout.started", {
  sessionId: "sess_77f",
  amount: 24900,
});

sequence.onAction("retention.intervene", (action) => {
  queue.publish("ops.behavior.action", action);
});`}<span className="live-cursor">|</span></code>
              </pre>
              <div className="scanline-overlay pointer-events-none absolute inset-0" />
            </div>
          </section>

          <section className="rounded-[6px] border border-divider bg-[#0f0f0f] p-6 md:p-7">
            <p className="tech-label text-[10px] text-text-tertiary">Live Transition Trace</p>
            <div className="mt-5 grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <p className="tech-label text-[10px] text-text-tertiary">event stream</p>
                <div className="mt-3 border border-divider bg-[#0b0b0b] px-4 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="tech-label text-[10px] text-text-tertiary">runtime online</p>
                    <p className="tech-label text-[10px] text-text-tertiary">14,221 transitions observed</p>
                  </div>
                  <ul className="space-y-1.5 font-mono text-[14px] leading-[1.7] text-[#d7d7d7]">
                    {[
                      "[14:22:01.118] landing",
                      "[14:22:02.006] -> pricing",
                      "[14:22:02.772] -> pricing",
                      "[14:22:03.490] -> cart",
                      "[14:22:04.229] -> pricing",
                    ].map((line, i) => (
                      <li
                        key={line}
                        className="trace-line"
                        style={{ animationDelay: `${i * 180}ms` }}
                      >
                        {line}
                      </li>
                    ))}
                    <li className="font-mono text-[14px] leading-[1.7] text-[#d7d7d7]">
                      <span className="live-cursor">|</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="space-y-4">
                <div className="border border-foreground/35 bg-[#131313] px-4 py-4">
                  <p className="tech-label text-[10px] text-text-tertiary">action emitted</p>
                  <p className="mt-2 text-xl font-medium text-white">offer_coupon</p>
                  <p className="mt-3 tech-label text-[10px] text-text-tertiary">confidence</p>
                  <p className="mt-1 text-[22px] text-foreground">84%</p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-sm border border-divider bg-[#0b0b0b]">
                    <div className="h-full w-[84%] bg-foreground/80" />
                  </div>
                </div>
                <div className="border border-divider bg-[#0b0b0b] px-4 py-4">
                  <p className="tech-label text-[10px] text-text-tertiary">reasoning</p>
                  <ul className="mt-3 space-y-2 text-[14px] leading-[1.5] text-text-secondary">
                    <li>- loop detected</li>
                    <li>- hesitation threshold exceeded</li>
                    <li>- recovery probability: high</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
