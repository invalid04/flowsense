import { ApiKeysManager } from "./ApiKeysManager";

export default function ApiKeysPage() {
  return (
    <div className="space-y-4">
      <section className="glass-panel animate-rise rounded-3xl p-6 md:p-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
          Developer Access
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          API Key Management
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Create and manage API credentials for secure ingestion and integration workflows.
        </p>
      </section>

      <ApiKeysManager />
    </div>
  );
}
