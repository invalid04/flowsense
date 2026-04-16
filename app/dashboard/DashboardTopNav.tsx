"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Insights" },
  { href: "/dashboard/flows", label: "Flows" },
  { href: "/dashboard/events", label: "Events" },
];

export function DashboardTopNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-900/90 bg-black/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[88rem] items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2.5 text-slate-100">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-black">
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path d="M3 13h4l2-5 3 9 2-5h7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-lg font-semibold tracking-tight">FlowSense</span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={[
                    "rounded-md px-3 py-1.5 text-sm transition",
                    active ? "bg-slate-900 text-slate-100" : "text-slate-400 hover:text-slate-200",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <button type="button" className="rounded-md p-1.5 hover:bg-slate-900 hover:text-slate-200" aria-label="Alerts">
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path d="M12 3a5 5 0 0 0-5 5v2.5L5 14v1h14v-1l-2-3.5V8a5 5 0 0 0-5-5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 18a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" className="rounded-md p-1.5 hover:bg-slate-900 hover:text-slate-200" aria-label="Settings">
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 1 0 12 8.5z" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 1-2 0 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 1 0-2 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 1 2 0 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 1 0 2 1.7 1.7 0 0 0-.6 1Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <UserButton />
        </div>
      </div>
    </header>
  );
}
