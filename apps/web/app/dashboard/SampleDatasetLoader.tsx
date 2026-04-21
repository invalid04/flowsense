"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SampleDatasetLoader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sampleMode = searchParams.get("sample");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (sampleMode !== "1" || status !== "idle") {
      return;
    }

    let cancelled = false;

    const loadSample = async () => {
      setStatus("loading");
      setMessage("Loading sample dataset into the model...");

      const res = await fetch("/api/upload/sample", {
        method: "POST",
      });

      const data = await res.json();

      if (cancelled) {
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Failed to load sample dataset.");
        return;
      }

      setStatus("success");
      setMessage(
        `Sample dataset loaded. Rows: ${data.totalRows}, Sessions: ${data.totalSessions}, Transitions: ${data.totalTransitions}`
      );
      router.replace("/dashboard?sample=loaded");
      router.refresh();
    };

    loadSample().catch(() => {
      if (!cancelled) {
        setStatus("error");
        setMessage("Failed to load sample dataset.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router, sampleMode, status]);

  if (sampleMode === "1" || sampleMode === "loaded" || message) {
    return (
      <div className="insights-system-card insights-card-indicator rounded-2xl px-5 py-4">
        <p className="text-sm font-semibold tracking-[0.12em] text-slate-400 uppercase">Guided Start</p>
        <p className="mt-2 text-sm text-slate-300">
          {sampleMode === "loaded" && status === "idle"
            ? "Sample dataset is active. Replace it anytime from Deep Dive -> Upload Event Data."
            : message}
        </p>
      </div>
    );
  }

  return null;
}
