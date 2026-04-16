"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TrackForm() {
  const router = useRouter();

  const [sessionKey, setSessionKey] = useState("session-1");
  const [fromState, setFromState] = useState("/home");
  const [toState, setToState] = useState("/dashboard");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionKey, fromState, toState }),
    });

    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="insights-surface flex h-full flex-col space-y-4 rounded-2xl p-5 md:p-6">
      <div>
        <h3 className="text-base font-semibold text-slate-100">Track Transition Event</h3>
        <p className="text-sm text-slate-400">Append a new state jump to your active sequence.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="field">
          <span className="field-label text-slate-400">Session Key</span>
          <input
            className="insights-input"
            value={sessionKey}
            onChange={(e) => setSessionKey(e.target.value)}
            placeholder="session-1"
          />
        </label>

        <label className="field">
          <span className="field-label text-slate-400">From State</span>
          <input
            className="insights-input"
            value={fromState}
            onChange={(e) => setFromState(e.target.value)}
            placeholder="/home"
          />
        </label>

        <label className="field">
          <span className="field-label text-slate-400">To State</span>
          <input
            className="insights-input"
            value={toState}
            onChange={(e) => setToState(e.target.value)}
            placeholder="/dashboard"
          />
        </label>
      </div>

      <button type="submit" className="insights-btn mt-auto w-full md:w-auto" disabled={loading}>
        {loading ? "Tracking..." : "Commit Transition"}
      </button>
    </form>
  );
}
