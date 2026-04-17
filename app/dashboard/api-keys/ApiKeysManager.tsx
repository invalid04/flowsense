"use client";

import { useEffect, useMemo, useState } from "react";
import { getBaseUrl } from "@/lib/getBaseUrl";

type ApiKeyListRecord = {
  id: string;
  accountId: string;
  label: string;
  maskedKey: string;
  revokedAt: string | null;
  createdAt: string;
};

type ApiKeyCreateRecord = {
  id: string;
  accountId: string;
  key: string;
  label: string;
  revokedAt: string | null;
  createdAt: string;
};

type ListResponse = {
  keys?: ApiKeyListRecord[];
  error?: string;
};

type CreateResponse = {
  key?: ApiKeyCreateRecord;
  error?: string;
};

type RevokeResponse = {
  key?: ApiKeyListRecord;
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

function toListRecord(created: ApiKeyCreateRecord): ApiKeyListRecord {
  return {
    id: created.id,
    accountId: created.accountId,
    label: created.label,
    maskedKey: maskApiKey(created.key),
    revokedAt: created.revokedAt,
    createdAt: created.createdAt,
  };
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKeyListRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [sendingTestToken, setSendingTestToken] = useState<string | null>(null);
  const [label, setLabel] = useState("Default Key");
  const [message, setMessage] = useState<string | null>(null);
  const [lastCreatedKey, setLastCreatedKey] = useState<ApiKeyCreateRecord | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
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
      } catch {
        if (!isCancelled) {
          setMessage("Failed to load API keys.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
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

    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ label }),
      });

      const data: CreateResponse = await res.json();
      const createdKey = data.key;

      if (!res.ok || !createdKey) {
        setMessage(data.error ?? "Failed to generate API key.");
        return;
      }

      setKeys((current) => [toListRecord(createdKey), ...current]);
      setLastCreatedKey(createdKey);
      setLabel("Default Key");
      setMessage("API key created successfully.");
    } catch {
      setMessage("Failed to generate API key.");
    } finally {
      setIsCreating(false);
    }
  };

  const copyValue = async (value: string, token: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedToken(token);
      setTimeout(() => {
        setCopiedToken((current) => (current === token ? null : current));
      }, 1400);
    } catch {
      setMessage("Clipboard access failed. Copy manually.");
    }
  };

  const revokeKey = async (id: string) => {
    const shouldRevoke = window.confirm("Revoke this API key? It will stop ingesting immediately.");
    if (!shouldRevoke) return;

    setRevokingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/api-keys/${id}/revoke`, { method: "POST" });
      const data: RevokeResponse = await res.json();
      const revokedKey = data.key;

      if (!res.ok || !revokedKey) {
        setMessage(data.error ?? "Failed to revoke API key.");
        return;
      }

      setKeys((current) =>
        current.map((item) => (item.id === id ? revokedKey : item))
      );

      setLastCreatedKey((current) => {
        if (!current || current.id !== id) return current;
        return { ...current, revokedAt: revokedKey.revokedAt ?? new Date().toISOString() };
      });

      setMessage("API key revoked.");
    } catch {
      setMessage("Failed to revoke API key.");
    } finally {
      setRevokingId(null);
    }
  };

  const sendTestEvent = async (apiKey: string, token: string) => {
    setSendingTestToken(token);
    setMessage(null);

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          sessionId: `test_session_${Date.now()}`,
          state: "/test-event",
        }),
      });

      if (!res.ok) {
        setMessage("Invalid API key or ingestion failed.");
        return;
      }

      setMessage("Test event sent successfully.");
    } catch {
      setMessage("Invalid API key or ingestion failed.");
    } finally {
      setSendingTestToken(null);
    }
  };

  const newestActiveKey = useMemo(
    () => keys.find((item) => item.revokedAt === null) ?? null,
    [keys]
  );

  const preferredKey = useMemo(() => {
    if (lastCreatedKey && lastCreatedKey.revokedAt === null) {
      return lastCreatedKey.key;
    }

    return "fs_live_xxx";
  }, [lastCreatedKey]);

  const baseUrl = getBaseUrl();
  const sdkScriptUrl = `${baseUrl}/flowsense-sdk.js`;
  const ingestEndpoint = `${baseUrl}/api/ingest`;

  const installSnippet = `<script src=\"${sdkScriptUrl}\"></script>`;

  const initSnippet = `FlowSense.init({\n  apiKey: \"${preferredKey}\",\n  endpoint: \"${ingestEndpoint}\"\n});`;

  const trackSnippet = `FlowSense.track(\"/home\");`;

  const fullSnippet = `${installSnippet}\n<script>\n  ${initSnippet.replace(/\n/g, "\n  ")}\n\n  ${trackSnippet}\n</script>`;

  return (
    <div className="space-y-4">
      <section className="insights-surface animate-rise rounded-3xl p-5 md:p-6">
        <h2 className="text-lg font-semibold text-slate-100">Generate API Key</h2>
        <p className="mt-1 text-sm text-slate-300">
          Create scoped keys for server-to-server event ingestion.
        </p>

        <form
          onSubmit={createKey}
          className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
        >
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">Key Label</span>
            <input
              className="insights-input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Production key"
            />
          </label>
          <button className="insights-btn w-full sm:w-auto" type="submit" disabled={isCreating}>
            {isCreating ? "Generating..." : "Generate Key"}
          </button>
        </form>
      </section>

      {lastCreatedKey && (
        <section className="insights-surface animate-rise rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5 md:p-6">
          <h3 className="text-base font-semibold text-slate-100">API key created successfully</h3>
          <p className="mt-1 text-sm text-slate-300">
            Store this securely. This full key will not be shown again.
          </p>
          <div className="mt-3 rounded-xl border border-slate-600/80 bg-black/45 px-4 py-3 font-mono text-sm text-slate-100">
            {lastCreatedKey.key}
          </div>
          <button
            type="button"
            onClick={() => copyValue(lastCreatedKey.key, "created-key")}
            className="mt-3 rounded-lg border border-slate-600/80 bg-black/40 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-black/55"
          >
            {copiedToken === "created-key" ? "Copied" : "Copy key"}
          </button>
        </section>
      )}

      <section className="insights-surface animate-rise overflow-hidden rounded-3xl" style={{ animationDelay: "80ms" }}>
        <div className="border-b border-slate-700/80 px-5 py-4 md:px-6">
          <h3 className="text-lg font-semibold text-slate-100">API Key Registry</h3>
          <p className="text-sm text-slate-300">
            Manage credentials used by your integrations.
          </p>
        </div>

        {isLoading ? (
          <p className="px-5 py-6 text-sm text-slate-300 md:px-6">Loading API keys...</p>
        ) : keys.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-300 md:px-6">
            No API keys yet. Generate your first key above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-700/80 bg-slate-950/35">
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-300 uppercase md:px-6">
                    Label
                  </th>
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-300 uppercase md:px-6">
                    Key
                  </th>
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-300 uppercase md:px-6">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-300 uppercase md:px-6">
                    Created
                  </th>
                  <th className="px-5 py-3 text-xs tracking-wide text-slate-300 uppercase md:px-6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {keys.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-800/70 last:border-b-0"
                  >
                    <td className="px-5 py-3 font-semibold text-slate-100 md:px-6">
                      {item.label}
                    </td>
                    <td className="px-5 py-3 font-mono text-sm text-slate-300 md:px-6">
                      {item.maskedKey}
                    </td>
                    <td className="px-5 py-3 text-sm md:px-6">
                      <span
                        className={
                          item.revokedAt
                            ? "rounded-full bg-rose-400/15 px-2.5 py-1 text-xs font-semibold text-rose-200"
                            : "rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-200"
                        }
                      >
                        {item.revokedAt ? "Revoked" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-300 md:px-6">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-5 py-3 md:px-6">
                      {item.revokedAt ? (
                        <span className="text-xs font-semibold text-slate-400">Unavailable</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              const canCopyFullValue = lastCreatedKey?.id === item.id && lastCreatedKey.revokedAt === null;
                              await copyValue(
                                canCopyFullValue ? lastCreatedKey.key : item.maskedKey,
                                `copy-row-${item.id}`
                              );
                              if (!canCopyFullValue) {
                                setMessage("Copied masked key. Create a new key to copy full value.");
                              }
                            }}
                            className="rounded-lg border border-slate-600/80 bg-black/40 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-black/55"
                          >
                            {copiedToken === `copy-row-${item.id}` ? "Copied" : "Copy"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!lastCreatedKey || lastCreatedKey.id !== item.id || lastCreatedKey.revokedAt !== null) {
                                setMessage("Create a new key to send a test event from this panel.");
                                return;
                              }
                              void sendTestEvent(lastCreatedKey.key, `send-test-${item.id}`);
                            }}
                            disabled={sendingTestToken === `send-test-${item.id}`}
                            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {sendingTestToken === `send-test-${item.id}` ? "Sending..." : "Send Test"}
                          </button>
                          <button
                            type="button"
                            onClick={() => revokeKey(item.id)}
                            disabled={revokingId === item.id}
                            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {revokingId === item.id ? "Revoking..." : "Revoke"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="insights-surface animate-rise rounded-3xl p-5 md:p-6" style={{ animationDelay: "120ms" }}>
        <h3 className="text-lg font-semibold text-slate-100">Developer Quickstart</h3>
        <p className="mt-1 text-sm text-slate-300">
          Embed the SDK and initialize it with your API key to begin tracking behavior flows.
        </p>

        {!lastCreatedKey && newestActiveKey && (
          <p className="mt-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-200">
            For security, full keys are only shown at creation time. Create a new key for ready-to-paste snippets.
          </p>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Install FlowSense</p>
              <button
                type="button"
                onClick={() => copyValue(installSnippet, "copy-install")}
                className="rounded-lg border border-slate-600/80 bg-black/40 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-black/55"
              >
                {copiedToken === "copy-install" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs text-slate-100">
              <code>{installSnippet}</code>
            </pre>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Initialize</p>
              <button
                type="button"
                onClick={() => copyValue(initSnippet, "copy-init")}
                className="rounded-lg border border-slate-600/80 bg-black/40 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-black/55"
              >
                {copiedToken === "copy-init" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs text-slate-100">
              <code>{initSnippet}</code>
            </pre>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Track Example</p>
              <button
                type="button"
                onClick={() => copyValue(trackSnippet, "copy-track")}
                className="rounded-lg border border-slate-600/80 bg-black/40 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-black/55"
              >
                {copiedToken === "copy-track" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs text-slate-100">
              <code>{trackSnippet}</code>
            </pre>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Drop-In Snippet</p>
              <button
                type="button"
                onClick={() => copyValue(fullSnippet, "copy-full")}
                className="rounded-lg border border-slate-600/80 bg-black/40 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-black/55"
              >
                {copiedToken === "copy-full" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs text-slate-100">
              <code>{fullSnippet}</code>
            </pre>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!lastCreatedKey || lastCreatedKey.revokedAt !== null) {
                  setMessage("Create a new active key, then send a test event.");
                  return;
                }
                void sendTestEvent(lastCreatedKey.key, "send-test-quickstart");
              }}
              disabled={sendingTestToken === "send-test-quickstart"}
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingTestToken === "send-test-quickstart" ? "Sending..." : "Send Test Event"}
            </button>
            <a
              href="/dashboard"
              className="text-xs font-semibold text-slate-300 underline decoration-dotted underline-offset-4 transition hover:text-slate-100"
            >
              View this event in your dashboard
            </a>
          </div>
        </div>
      </section>

      {message && <p className="text-sm font-medium text-slate-200">{message}</p>}
    </div>
  );
}
