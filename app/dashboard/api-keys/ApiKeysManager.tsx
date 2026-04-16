"use client";

import { useEffect, useState } from "react";

type ApiKeyRecord = {
  id: string;
  accountId: string;
  key: string;
  label: string;
  createdAt: string;
};

type ListResponse = {
  keys?: ApiKeyRecord[];
  error?: string;
};

type CreateResponse = {
  key?: ApiKeyRecord;
  error?: string;
};

function maskApiKey(value: string) {
  if (value.length <= 10) return value;
  return `${value.slice(0, 10)}...${value.slice(-4)}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [label, setLabel] = useState("Default Key");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      const res = await fetch("/api/api-keys");
      const data: ListResponse = await res.json();

      if (isCancelled) return;

      if (!res.ok) {
        setMessage(data.error ?? "Failed to load API keys.");
        setIsLoading(false);
        return;
      }

      const sorted = [...(data.keys ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setKeys(sorted);
      setIsLoading(false);
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, []);

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setMessage(null);

    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ label }),
    });

    const data: CreateResponse = await res.json();
    if (!res.ok || !data.key) {
      setMessage(data.error ?? "Failed to generate API key.");
      setIsCreating(false);
      return;
    }

    setKeys((current) => [data.key, ...current]);
    setLabel("Default Key");
    setMessage("API key generated successfully.");
    setIsCreating(false);
  };

  const copyKey = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("API key copied to clipboard.");
    } catch {
      setMessage("Clipboard access failed. Copy manually from the row.");
    }
  };

  return (
    <div className="space-y-4">
      <section className="glass-panel animate-rise rounded-3xl p-5 md:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Generate API Key</h2>
        <p className="mt-1 text-sm text-slate-500">
          Create scoped keys for server-to-server event ingestion.
        </p>

        <form
          onSubmit={createKey}
          className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
        >
          <label className="field">
            <span className="field-label">Key Label</span>
            <input
              className="enterprise-input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Production key"
            />
          </label>
          <button className="enterprise-btn w-full sm:w-auto" type="submit" disabled={isCreating}>
            {isCreating ? "Generating..." : "Generate Key"}
          </button>
        </form>
      </section>

      <section className="glass-panel animate-rise overflow-hidden rounded-3xl" style={{ animationDelay: "80ms" }}>
        <div className="border-b border-[var(--panel-border)] px-5 py-4 md:px-6">
          <h3 className="text-lg font-semibold text-slate-900">API Key Registry</h3>
          <p className="text-sm text-slate-500">
            Manage credentials used by your integrations.
          </p>
        </div>

        {isLoading ? (
          <p className="px-5 py-6 text-sm text-slate-500 md:px-6">Loading API keys...</p>
        ) : keys.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500 md:px-6">
            No API keys yet. Generate your first key above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--panel-border)] bg-slate-50/70">
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-600 uppercase md:px-6">
                    Label
                  </th>
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-600 uppercase md:px-6">
                    Key
                  </th>
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-600 uppercase md:px-6">
                    Created
                  </th>
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-600 uppercase md:px-6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {keys.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--panel-border)]/70 last:border-b-0"
                  >
                    <td className="px-5 py-3 font-semibold text-slate-800 md:px-6">
                      {item.label}
                    </td>
                    <td className="px-5 py-3 font-mono text-sm text-slate-700 md:px-6">
                      {maskApiKey(item.key)}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600 md:px-6">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-5 py-3 md:px-6">
                      <button
                        type="button"
                        onClick={() => copyKey(item.key)}
                        className="rounded-lg border border-[var(--panel-border)] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {message && (
        <p className="text-sm font-medium text-slate-700">{message}</p>
      )}
    </div>
  );
}
