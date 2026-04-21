"use client";

import Script from "next/script";
import { useState } from "react";

export default function SdkTestPage() {
  const [state, setState] = useState("/home");
  const [fromState, setFromState] = useState("/home");
  const [toState, setToState] = useState("/pricing");
  const [status, setStatus] = useState("SDK not initialized");

  return (
    <main className="min-h-screen p-8">
      <Script
        src="/flowsense-sdk.js"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            window.FlowSense?.init({
              apiKey: "fs_live_c4f55a3c6c534f9a939aef22da17b27e",
              endpoint: "https://sequence-1-pwbq.onrender.com/track",
              debug: true,
            });
            setStatus("SDK initialized");
          } catch (error) {
            setStatus(
              error instanceof Error ? error.message : "Failed to initialize SDK"
            );
          }
        }}
      />

      <div className="mx-auto max-w-xl space-y-6 rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">FlowSense SDK Test</h1>
        <p className="text-sm text-gray-600">{status}</p>

        <div className="space-y-2">
          <h2 className="text-lg font-medium">Track current state</h2>
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
                setStatus(result?.message ?? `Tracked state: ${state}`);
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

        <div className="space-y-2">
          <h2 className="text-lg font-medium">Track explicit transition</h2>

          <input
            className="w-full rounded border px-3 py-2"
            value={fromState}
            onChange={(e) => setFromState(e.target.value)}
            placeholder="From state"
          />

          <input
            className="w-full rounded border px-3 py-2"
            value={toState}
            onChange={(e) => setToState(e.target.value)}
            placeholder="To state"
          />

          <button
            className="rounded bg-black px-4 py-2 text-white"
            onClick={async () => {
              try {
                const result = await window.FlowSense?.trackTransition?.(
                  fromState,
                  toState
                );
                setStatus(
                  result?.message ??
                    `Tracked transition: ${fromState} -> ${toState}`
                );
              } catch (error) {
                setStatus(
                  error instanceof Error
                    ? error.message
                    : "Transition track failed"
                );
              }
            }}
          >
            Track Transition
          </button>
        </div>
      </div>
    </main>
  );
}
