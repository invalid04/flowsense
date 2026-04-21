"use client";

import { useState } from "react";

type PredictionResponse = {
  currentState: string;
  prediction: string | null;
  probability: number | null;
  totalTransitions?: number;
  message?: string;
  error?: string;
};

export function PredictionPanel() {
  const [currentState, setCurrentState] = useState("/home");
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch(`/api/predict?currentState=${encodeURIComponent(currentState)}`);

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="insights-system-card insights-console-module insights-card-indicator rounded-2xl p-5 md:p-6">
      <p className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">System Module</p>
      <h3 className="text-base font-semibold text-slate-100">Predict Next Step</h3>
      <p className="mt-1 text-sm text-slate-400">Estimate the most likely next state from any point in the journey.</p>

      <form onSubmit={handlePredict} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="field flex-1">
          <span className="field-label text-slate-400">Current State</span>
          <input
            className="insights-input-console"
            value={currentState}
            onChange={(e) => setCurrentState(e.target.value)}
            placeholder="/home"
          />
        </label>
        <button className="insights-btn w-auto" type="submit" disabled={loading}>
          {loading ? "Predicting..." : "Run Prediction"}
        </button>
      </form>

      {result ? (
        <div className="mt-4 rounded-2xl border border-slate-700/80 bg-slate-950/55 p-4">
          {"error" in result && result.error ? (
            <p className="text-sm font-medium text-rose-300">{result.error}</p>
          ) : result.prediction ? (
            <div className="space-y-2 text-sm text-slate-200">
              <p>
                <span className="font-semibold text-slate-300">Current:</span> {result.currentState}
              </p>
              <p>
                <span className="font-semibold text-slate-300">Predicted next:</span> {result.prediction}
              </p>
              <p>
                <span className="font-semibold text-slate-300">Confidence:</span>{" "}
                <span className="text-cyan-300">{((result.probability ?? 0) * 100).toFixed(1)}%</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-300">{result.message ?? "No prediction available."}</p>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/30 p-4 text-sm text-slate-400">
          Enter a state and run prediction to inspect likely user movement.
        </div>
      )}
    </div>
  );
}
