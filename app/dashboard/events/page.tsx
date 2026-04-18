"use client";

import { useEffect, useMemo, useState } from "react";

type EventMetric = {
  totalEvents: number;
  uniqueEvents: number;
  eventsPerSession: number;
  errorRate: number;
};

type EventCategory = {
  label: string;
  count: number;
};

type EventRow = {
  name: string;
  type: string;
  count: number;
  delta: string;
  deltaTone: "up" | "down" | "neutral";
  lastTriggered: string;
  meaning: string;
  tags: string[];
};

type EventsResponse = {
  metrics: EventMetric;
  categories: EventCategory[];
  rows: EventRow[];
  error?: string;
};

export default function EventsPage() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        const json: EventsResponse = await res.json();

        if (!res.ok) {
          setError(json.error ?? "Failed to load events");
          setData(null);
          return;
        }

        setData(json);
      } catch {
        setError("Failed to load events");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data.rows;

    const needle = search.toLowerCase();
    return data.rows.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        row.type.toLowerCase().includes(needle) ||
        row.meaning.toLowerCase().includes(needle)
    );
  }, [data, search]);

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-slate-100">Journey Events</h1>
          <p className="mt-2 text-2xl text-slate-400">Event data with conversion meaning, not just telemetry</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-slate-700 bg-transparent px-4 py-2 text-base font-semibold text-slate-100">
            Export
          </button>
          <button className="rounded-lg bg-slate-100 px-4 py-2 text-base font-semibold text-black">
            + New Event
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="insights-surface rounded-2xl px-5 py-4">
          <p className="text-sm text-slate-400">Total Events</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? data.metrics.totalEvents.toLocaleString() : loading ? "..." : "0"}
          </p>
        </article>
        <article className="insights-surface rounded-2xl px-5 py-4">
          <p className="text-sm text-slate-400">Unique Events</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? data.metrics.uniqueEvents.toLocaleString() : loading ? "..." : "0"}
          </p>
        </article>
        <article className="insights-surface rounded-2xl px-5 py-4">
          <p className="text-sm text-slate-400">Events/Session</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? data.metrics.eventsPerSession.toFixed(1) : loading ? "..." : "0.0"}
          </p>
        </article>
        <article className="insights-surface rounded-2xl px-5 py-4">
          <p className="text-sm text-slate-400">Error Events</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? `${data.metrics.errorRate.toFixed(2)}%` : loading ? "..." : "0.00%"}
          </p>
        </article>
      </section>

      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {(data?.categories ?? []).map((category, index) => (
            <button
              key={category.label}
              className={[
                "rounded-full px-3 py-1.5 text-sm",
                index === 0 ? "bg-slate-100 text-black" : "bg-slate-900 text-slate-300",
              ].join(" ")}
            >
              {category.label} {category.count}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            className="h-11 w-72 rounded-xl border border-slate-800 bg-slate-900 px-4 text-base text-slate-100 placeholder:text-slate-500"
            placeholder="Search events..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="h-11 rounded-xl border border-slate-700 px-4 text-base font-semibold text-slate-100">Filter</button>
        </div>
      </section>

      <section className="insights-surface overflow-hidden rounded-2xl">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_8rem_8rem] border-b border-slate-800 px-4 py-3 text-sm text-slate-500">
          <p>Event Name</p>
          <p>Business Meaning</p>
          <p className="text-right">Count (7d)</p>
          <p className="text-right">Last Triggered</p>
        </div>

        {error ? <p className="px-4 py-4 text-sm text-rose-300">{error}</p> : null}

        {loading ? <p className="px-4 py-4 text-sm text-slate-400">Loading events...</p> : null}

        {!loading && !error ? (
          <div>
            {filteredRows.length > 0 ? (
              filteredRows.map((event) => (
                <article
                  key={`${event.name}-${event.type}`}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_8rem_8rem] items-start border-b border-slate-800/70 px-4 py-3 text-base last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-100">{event.name}</p>
                    <p className="text-sm text-slate-500">{event.type}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {event.tags.map((tag) => (
                        <span key={`${event.name}-${tag}`} className="rounded-full border border-slate-600 bg-slate-900 px-2 py-0.5 text-xs text-slate-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pr-4 text-sm text-slate-300">
                    <p>{event.meaning}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-slate-100">{event.count.toLocaleString()}</p>
                    <p
                      className={[
                        "text-sm",
                        event.deltaTone === "up"
                          ? "text-emerald-400"
                          : event.deltaTone === "down"
                            ? "text-orange-400"
                            : "text-slate-500",
                      ].join(" ")}
                    >
                      {event.deltaTone === "neutral" ? "0.0%" : `${event.deltaTone === "up" ? "+" : "-"}${event.delta}%`}
                    </p>
                  </div>
                  <p className="text-right text-slate-400">{event.lastTriggered}</p>
                </article>
              ))
            ) : (
              <p className="px-4 py-4 text-sm text-slate-400">No events found.</p>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
