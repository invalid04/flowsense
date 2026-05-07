export default function Home() {
  return (
    <div className="page-shell">
      <div className="content-container">
        <header className="flex items-center justify-between py-6">
          <a
            href="#"
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
          <div className="hidden items-center gap-11 text-[11px] tech-label text-[#bdbdbd] md:flex">
            <a className="transition-colors hover:text-foreground" href="#">
              Product
            </a>
            <a className="transition-colors hover:text-foreground" href="/docs">
              Docs
            </a>
            <a className="transition-colors hover:text-foreground" href="#">
              API
            </a>
            <a className="transition-colors hover:text-foreground" href="#">
              Pricing
            </a>
            <a className="transition-colors hover:text-foreground" href="#">
              Login
            </a>
            <a
              className="button-group inline-flex h-11 items-center gap-2 rounded-[4px] border border-divider-strong px-5 text-[11px] tracking-[0.16em] text-foreground transition-colors hover:border-foreground/50"
              href="#"
            >
              Run prediction
              <span className="button-arrow text-[13px]">→</span>
            </a>
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center rounded-[4px] border border-divider px-3 tech-label text-[10px] text-foreground/75 md:hidden"
          >
            Menu
          </button>
        </header>

        <main className="pb-12 md:pb-14">
          <section className="grid gap-12 pb-24 pt-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16 lg:pb-[112px]">
            <div className="max-w-[780px]">
              <h1 className="max-w-[660px] text-[58px] font-normal leading-[0.98] tracking-[-0.03em] text-foreground sm:text-[74px] lg:text-[92px] xl:text-[108px]">
                Predict what
                <br />
                happens next.
              </h1>
              <p className="mt-14 text-[26px] font-normal leading-[1.25] tracking-[-0.01em] text-text-secondary sm:text-[30px] lg:text-[34px]">
                This is not analytics.
                <br />
                <span className="font-medium text-foreground">This is sequence intelligence.</span>
              </p>
              <div className="mt-7 h-px w-[min(340px,82vw)] bg-divider-soft" />
              <p className="mt-7 max-w-[470px] text-[17px] leading-[1.56] text-text-secondary sm:text-[18px]">
                Most tools tell you what already happened.
                <br />
                Sequence tells you what will.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <a
                  className="button-group inline-flex h-12 items-center gap-2 rounded-[4px] border border-divider-strong bg-surface-soft px-5 text-[11px] tech-label text-foreground transition-colors hover:border-foreground/56"
                  href="#"
                >
                  Run prediction
                  <span className="button-arrow text-[13px]">→</span>
                </a>
                <a
                  className="button-group inline-flex items-center gap-2 text-[11px] tech-label text-foreground/80 transition-colors hover:text-foreground"
                  href="#"
                >
                  Watch overview
                  <span className="button-arrow text-[12px]">▶</span>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-center lg:-translate-x-12 lg:justify-end">
              <svg
                viewBox="0 0 610 250"
                className="h-auto w-full max-w-[700px] overflow-visible"
                aria-label="Sequence graph"
                role="img"
              >
                <line x1="28" y1="125" x2="284" y2="125" stroke="rgba(255,255,255,0.11)" strokeWidth="1" />
                <line
                  x1="284"
                  y1="125"
                  x2="384"
                  y2="125"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                  strokeDasharray="2.4 3.6"
                />
                <line x1="384" y1="125" x2="518" y2="125" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <line x1="518" y1="125" x2="578" y2="125" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

                <path
                  d="M284 125 C 332 116, 354 96, 394 66 S 462 42, 518 42"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                  strokeDasharray="2.2 3.8"
                />
                <path
                  d="M284 125 C 332 134, 354 158, 396 188 S 462 208, 518 208"
                  fill="none"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="1"
                  strokeDasharray="2.2 3.8"
                />

                <circle cx="28" cy="125" r="3.4" fill="rgba(255,255,255,0.34)" />
                <circle cx="96" cy="125" r="3.4" fill="rgba(255,255,255,0.3)" />
                <circle cx="164" cy="125" r="3.4" fill="rgba(255,255,255,0.3)" />
                <circle cx="232" cy="125" r="3.4" fill="rgba(255,255,255,0.32)" />
                <circle cx="284" cy="125" r="4" fill="rgba(255,255,255,0.82)" />

                <circle cx="518" cy="42" r="4.1" fill="rgba(255,255,255,0.43)" />
                <circle cx="518" cy="125" r="4.1" fill="rgba(255,255,255,0.39)" />
                <circle cx="518" cy="208" r="4.1" fill="rgba(255,255,255,0.37)" />
                <circle cx="578" cy="125" r="8.4" fill="none" stroke="rgba(255,255,255,0.68)" strokeWidth="1.2" />
              </svg>
            </div>
          </section>

          <section className="border-t border-divider-soft border-b border-divider">
            <div className="grid divide-y divide-divider py-8 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
              {[
                {
                  number: "01",
                  title: "SEE THE FUTURE",
                  lines: ["Predict next actions", "with real-time probability."],
                },
                {
                  number: "02",
                  title: "FIND WHAT OTHERS MISS",
                  lines: ["Detect drop-offs, loops,", "and hidden paths."],
                },
                {
                  number: "03",
                  title: "BUILT FOR SYSTEMS",
                  lines: ["Integrate at the API level.", "Trigger actions in real time."],
                },
                {
                  number: "04",
                  title: "NOT ANOTHER DASHBOARD",
                  lines: ["No charts. No noise.", "Just signal."],
                },
              ].map((item) => (
                <article key={item.number} className="px-6 py-8 lg:px-7">
                  <p className="tech-label text-[11px] text-[#6a6a6a]">{item.number}</p>
                  <h2 className="mt-4 text-[18px] font-medium tracking-[0.06em] text-foreground">{item.title}</h2>
                  <p className="mt-4 text-[16px] leading-[1.58] text-text-body-muted">
                    {item.lines[0]}
                    <br />
                    {item.lines[1]}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-12 border-b hairline py-20 text-center md:mt-16 md:py-24">
            <p className="mx-auto max-w-[930px] text-balance text-[38px] font-normal leading-[1.24] tracking-[-0.01em] text-foreground sm:text-[46px] lg:text-[58px]">
              Behavior is a system.
              <br />
              Once you see the sequence, you don&apos;t go back.
            </p>
            <a
              href="#"
              className="button-group mx-auto mt-9 inline-flex h-11 items-center gap-3 rounded-[4px] border border-divider px-6 text-[11px] tech-label text-foreground transition-colors hover:border-foreground/48"
            >
              Run your first sequence
              <span className="button-arrow text-[13px]">→</span>
            </a>
            <p className="mt-3 text-[11px] text-text-tertiary">No credit card required.</p>
          </section>
        </main>

        <footer className="flex flex-col gap-6 py-7 text-[10px] tech-label text-text-tertiary md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center gap-3 text-foreground/90">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-foreground/90" />
              <span className="h-px w-5 bg-foreground/60" />
              <span className="size-1.5 rounded-full bg-foreground/90" />
            </span>
            <span>SEQUENCE</span>
          </div>
          <p className="text-[10px] normal-case tracking-[0.06em] text-text-tertiary md:ml-[-8%]">
            © 2024 Sequence Labs, Inc.
          </p>
          <nav className="flex flex-wrap items-center gap-7 md:justify-end">
            <a className="transition-colors hover:text-foreground" href="/docs">
              Docs
            </a>
            <a className="transition-colors hover:text-foreground" href="#">
              API
            </a>
            <a className="transition-colors hover:text-foreground" href="#">
              Status
            </a>
            <a className="transition-colors hover:text-foreground" href="#">
              Privacy
            </a>
            <a className="transition-colors hover:text-foreground" href="#">
              Terms
            </a>
          </nav>
        </footer>
      </div>
    </div>
  );
}
