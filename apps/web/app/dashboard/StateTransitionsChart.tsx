"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TransitionRow = {
  toState: string;
  count: number;
  probability: number;
};

type ApiResponse = {
  currentState: string;
  transition?: TransitionRow[];
  transitions?: TransitionRow[];
  error?: string;
};

export function StateTransitionsChart() {
  const [currentState, setCurrentState] = useState("/product");
  const [data, setData] = useState<TransitionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/state-transitions?currentState=${encodeURIComponent(currentState)}`
      );

      const json: ApiResponse = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to load chart data");
        setData([]);
        setLoading(false);
        return;
      }

      const rows = json.transitions ?? json.transition ?? [];
      setData(
        rows.map((row) => ({
          ...row,
          probability: Number((row.probability * 100).toFixed(1)),
        }))
      );
    } catch {
      setError("Failed to load chart data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="insights-system-card insights-card-indicator rounded-2xl p-5 md:p-6">
      <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Behavior Signals</p>
      <h3 className="text-base font-semibold text-slate-100">Transition Distribution</h3>
      <p className="mt-1 text-sm text-slate-400">Support insight cards with raw probability data per destination state.</p>

      <form onSubmit={handleLoad} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="field flex-1">
          <span className="field-label text-slate-400">Current State</span>
          <input
            className="insights-input"
            value={currentState}
            onChange={(e) => setCurrentState(e.target.value)}
            placeholder="/product"
          />
        </label>
        <button type="submit" className="insights-btn" disabled={loading}>
          {loading ? "Loading..." : "Load Chart"}
        </button>
      </form>

      {error && <p className="mb-4 mt-3 text-sm text-rose-300">{error}</p>}

      <div className="mt-5 h-80 w-full rounded-2xl border border-slate-700/80 bg-slate-950/55 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis
              dataKey="toState"
              tick={{ fill: "#cbd5e1", fontSize: 12 }}
              axisLine={{ stroke: "rgba(148, 163, 184, 0.24)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#cbd5e1", fontSize: 12 }}
              axisLine={{ stroke: "rgba(148, 163, 184, 0.24)" }}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(56, 189, 248, 0.12)" }}
              contentStyle={{
                borderRadius: "12px",
                background: "#0f172a",
                color: "#e2e8f0",
                border: "1px solid rgba(148, 163, 184, 0.24)",
              }}
              formatter={(value, name) => {
                if (name === "probability") return [`${value}%`, "Probability"];
                return [value, "Count"];
              }}
            />
            <Bar dataKey="probability" fill="#38bdf8" radius={[8, 8, 0, 0]} maxBarSize={56} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
