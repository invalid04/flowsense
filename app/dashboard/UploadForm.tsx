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
    <div className="glass-panel rounded-3xl p-5 md:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Upload Event Data</h2>
      <p className="mt-1 text-sm text-slate-500">
        Import a CSV to refresh sessions and transition probabilities.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="field flex-1">
          <span className="field-label">CSV File</span>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="enterprise-input"
          />
        </label>
        <button type="submit" disabled={loading} className="enterprise-btn">
          {loading ? "Uploading..." : "Upload CSV"}
        </button>
      </form>

      {message && (
        <p className="mt-3 text-sm text-slate-700">
          {message}
        </p>
      )}
    </div>
  );
}
