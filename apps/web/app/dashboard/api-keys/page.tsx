import { ApiKeysManager } from "./ApiKeysManager";

export default function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <section className="insights-module-card insights-card-indicator animate-rise rounded-3xl p-6 md:p-8">
        <div className="insights-module-header">
          <p className="insights-module-label">FLOWSENSE - DATA CONNECTION</p>
          <h1 className="insights-module-title">Connect Your Product Data</h1>
          <p className="insights-module-support">
            Ingest real user behavior to power your conversion intelligence.
          </p>
          <div className="insights-signal-bars w-24">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <ApiKeysManager />
    </div>
  );
}
