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

  const normalizeTag = (tag: string) => {
    const key = tag.toLowerCase();
    if (key.includes("high frequency")) return "High Frequency";
    if (key.includes("drop-off") || key.includes("dropoff")) return "Drop-off Risk";
    if (key.includes("conversion")) return "Conversion Critical";
    return tag;
  };

  return (
    <div className="space-y-8">
      <section className="insights-module-card insights-card-indicator animate-rise rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="insights-module-header">
            <p className="insights-module-label">FLOWSENSE - EVENT INTELLIGENCE</p>
            <h1 className="insights-module-title">Journey Events</h1>
            <p className="insights-module-support">
              Behavior signals with conversion meaning, not just telemetry.
            </p>
            <div className="insights-signal-bars w-24">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="insights-btn-secondary">
              Export
            </button>
            <button className="insights-btn">
              + New Signal
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="insights-metric-card insights-card-indicator rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Signal Volume</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? data.metrics.totalEvents.toLocaleString() : loading ? "..." : "0"}
          </p>
          <p className="mt-1 text-xs text-slate-400">Total behavior signals observed</p>
        </article>
        <article className="insights-metric-card insights-card-indicator rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Unique Signals</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? data.metrics.uniqueEvents.toLocaleString() : loading ? "..." : "0"}
          </p>
          <p className="mt-1 text-xs text-slate-400">Distinct signal paths tracked</p>
        </article>
        <article className="insights-metric-card insights-card-indicator rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Signals / Session</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? data.metrics.eventsPerSession.toFixed(1) : loading ? "..." : "0.0"}
          </p>
          <p className="mt-1 text-xs text-slate-400">Average signal intensity</p>
        </article>
        <article className="insights-metric-card insights-card-indicator rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Error Signal Rate</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-100">
            {data ? `${data.metrics.errorRate.toFixed(2)}%` : loading ? "..." : "0.00%"}
          </p>
          <p className="mt-1 text-xs text-slate-400">Share of signals tied to failures</p>
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
            placeholder="Search behavior signals..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="insights-btn-secondary">Filter</button>
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold tracking-[0.16em] text-slate-300 uppercase">FLOWSENSE - SIGNAL TABLE</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">Behavior Signals</h2>
        <p className="mt-1 text-sm text-slate-300">Signal volume and conversion relevance by path.</p>
      </section>

      <section className="insights-table-shell overflow-hidden rounded-2xl">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_8rem_8rem] border-b border-slate-800 px-4 py-3 text-sm text-slate-500">
          <p>Signal Path</p>
          <p>Conversion Meaning</p>
          <p className="text-right">Signal Volume (7d)</p>
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
                  className="insights-table-row grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_8rem_8rem] items-start px-4 py-4 text-base last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-100">{event.name}</p>
                    <p className="text-sm text-slate-500">{event.type}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(event.tags.length > 0 ? event.tags : ["Conversion Critical"]).map((tag) => (
                        <span key={`${event.name}-${tag}`} className="rounded-full border border-slate-600 bg-slate-900 px-2 py-0.5 text-xs text-slate-300">
                          {normalizeTag(tag)}
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
