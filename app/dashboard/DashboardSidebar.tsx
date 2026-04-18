"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Growth Opportunities",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
      >
        <path
          d="M4 19.5V9.75M12 19.5V4.5M20 19.5V13.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/dashboard/api-keys",
    label: "Connect Data",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
      >
        <path
          d="M14 10a4 4 0 1 0-2.68 3.78L12.8 15.3h2.1v2.1H17V15.3h2.1v-2.1h-3.15l-1.65-1.65A4 4 0 0 0 14 10Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="insights-surface h-fit rounded-3xl p-4 md:p-5 lg:sticky lg:top-6">
      <div className="mb-4 px-2">
        <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">
          FlowSense Workspace
        </p>
        <p className="mt-2 text-lg font-semibold text-slate-100">Growth Opportunities</p>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "inline-flex items-center justify-start gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "border-cyan-300/60 bg-cyan-500/15 text-cyan-100"
                  : "border-slate-700/70 bg-slate-900/50 text-slate-300 hover:border-slate-500 hover:text-slate-100",
              ].join(" ")}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
