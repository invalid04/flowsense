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
    <div className="glass-panel rounded-3xl p-5 md:p-6">
      <h2 className="text-lg font-semibold text-slate-900">State Transition Chart</h2>
      <p className="mt-1 text-sm text-slate-500">
        Compare likely destination states by probability.
      </p>

      <form onSubmit={handleLoad} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="field flex-1">
          <span className="field-label">Current State</span>
          <input
            className="enterprise-input"
            value={currentState}
            onChange={(e) => setCurrentState(e.target.value)}
            placeholder="/product"
          />
        </label>
        <button type="submit" className="enterprise-btn" disabled={loading}>
          {loading ? "Loading..." : "Load Chart"}
        </button>
      </form>

      {error && <p className="mt-3 mb-4 text-sm text-red-700">{error}</p>}

      <div className="mt-5 h-80 w-full rounded-2xl border border-[var(--panel-border)] bg-white/75 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.15)" />
            <XAxis
              dataKey="toState"
              tick={{ fill: "#334155", fontSize: 12 }}
              axisLine={{ stroke: "rgba(15, 23, 42, 0.2)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#334155", fontSize: 12 }}
              axisLine={{ stroke: "rgba(15, 23, 42, 0.2)" }}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(0, 87, 217, 0.08)" }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid rgba(15, 23, 42, 0.12)",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.14)",
              }}
              formatter={(value, name) => {
                if (name === "probability") return [`${value}%`, "Probability"];
                return [value, "Count"];
              }}
            />
            <Bar
              dataKey="probability"
              fill="#0057d9"
              radius={[8, 8, 0, 0]}
              maxBarSize={56}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
