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
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap gap-2 rounded-xl border p-4"
    >
      <input
        className="rounded border px-3 py-2"
        value={sessionKey}
        onChange={(e) => setSessionKey(e.target.value)}
        placeholder="Session Key"
      />
      <input
        className="rounded border px-3 py-2"
        value={fromState}
        onChange={(e) => setFromState(e.target.value)}
        placeholder="From State"
      />
      <input
        className="rounded border px-3 py-2"
        value={toState}
        onChange={(e) => setToState(e.target.value)}
        placeholder="To State"
      />
      <button
        type="submit"
        className="rounded bg-black px-4 py-2 text-white"
        disabled={loading}
      >
        {loading ? "Tracking..." : "Track"}
      </button>
    </form>
  );
}