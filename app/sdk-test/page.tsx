"use client";

import Script from "next/script";
import { useState } from "react";

declare global {
  interface Window {
    FlowSense?: {
      init: (config: { apiKey: string; endpoint?: string }) => void;
      track: (state: string) => Promise<{ message: string }>;
    };
  }
}

export default function SdkTestPage() {
  const [state, setState] = useState("/home");
  const [status, setStatus] = useState("SDK not initialized");

  return (
    <main className="min-h-screen p-8">
      <Script
        src="/flowsense-sdk.js"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            window.FlowSense?.init({
              apiKey: "test_key_123",
              endpoint: "/api/ingest",
            });
            setStatus("SDK initialized");
          } catch (error) {
            setStatus(
              error instanceof Error ? error.message : "Failed to initialize SDK"
            );
          }
        }}
      />

      <div className="mx-auto max-w-xl space-y-4 rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">FlowSense SDK Test</h1>
        <p className="text-sm text-gray-600">{status}</p>

        <input
          className="w-full rounded border px-3 py-2"
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder="State"
        />

        <button
          className="rounded bg-black px-4 py-2 text-white"
          onClick={async () => {
            try {
              const result = await window.FlowSense?.track(state);
              setStatus(result?.message ?? "Tracked");
            } catch (error) {
              setStatus(
                error instanceof Error ? error.message : "Track failed"
              );
            }
          }}
        >
          Track State
        </button>
      </div>
    </main>
  );
}