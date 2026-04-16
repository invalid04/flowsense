"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please choose a CSV file");
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error ?? "Upload failed.");
      setLoading(false);
      return;
    }

    setMessage(
      `Upload successful. Rows: ${data.totalRows}, Sessions: ${data.totalSessions}, Transitions: ${data.totalTransitions}`
    );
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="insights-surface rounded-2xl p-5 md:p-6">
      <h3 className="text-base font-semibold text-slate-100">Upload Event Data</h3>
      <p className="mt-1 text-sm text-slate-400">Import a CSV to refresh sessions and transition probabilities.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      >
        <label className="field min-w-0">
          <span className="field-label text-slate-400">CSV File</span>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="insights-input"
          />
        </label>
        <button type="submit" disabled={loading} className="insights-btn w-full sm:w-auto">
          {loading ? "Uploading..." : "Upload CSV"}
        </button>
      </form>

      {message && <p className="mt-3 break-words text-sm text-slate-300">{message}</p>}
    </div>
  );
}
