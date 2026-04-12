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

    const res = await fetch(
      `/api/predict?currentState=${encodeURIComponent(currentState)}`
    );

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="glass-panel flex h-full flex-col rounded-3xl p-5 md:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Prediction Engine</h2>
      <p className="mt-1 text-sm text-slate-500">
        Query likely next behavior from the current model.
      </p>

      <form onSubmit={handlePredict} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="field flex-1">
          <span className="field-label">Current State</span>
          <input
            className="enterprise-input"
            value={currentState}
            onChange={(e) => setCurrentState(e.target.value)}
            placeholder="/home"
          />
        </label>
        <button className="enterprise-btn w-full sm:w-auto" type="submit" disabled={loading}>
          {loading ? "Predicting..." : "Run Prediction"}
        </button>
      </form>

      {result && (
        <div className="mt-4 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4">
          {"error" in result && result.error ? (
            <p className="text-sm font-medium text-red-700">{result.error}</p>
          ) : result.prediction ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">Current:</span> {result.currentState}
              </p>
              <p>
                <span className="font-semibold">Predicted Next:</span> {result.prediction}
              </p>
              <p>
                <span className="font-semibold">Confidence:</span>{" "}
                <span className="text-[var(--accent)]">
                  {((result.probability ?? 0) * 100).toFixed(1)}%
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              {result.message ?? "No prediction available."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
