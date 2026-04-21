(function (window) {
    const FlowSense = {
      apiKey: null,
      endpoint: null,
      sessionId: null,
      lastTrackedState: null,
      routePoller: null,
  
      init(config) {
        if (!config || !config.apiKey) {
          throw new Error("FlowSense.init requires an apiKey");
        }
  
        this.apiKey = config.apiKey;
        this.endpoint = config.endpoint || "/api/ingest";
  
        const existingSessionId = window.localStorage.getItem("flowsense_session_id");
  
        if (existingSessionId) {
          this.sessionId = existingSessionId;
        } else {
          this.sessionId = this.generateSessionId();
          window.localStorage.setItem("flowsense_session_id", this.sessionId);
        }
  
        // Track initial page load
        this.track(window.location.pathname).catch((error) => {
          console.error("FlowSense auto-track failed:", error);
        });
  
        // Track SPA route changes
        let lastPath = window.location.pathname;
  
        if (this.routePoller) {
          clearInterval(this.routePoller);
        }
  
        this.routePoller = setInterval(() => {
          const currentPath = window.location.pathname;
  
          if (currentPath !== lastPath) {
            lastPath = currentPath;
  
            this.track(currentPath).catch((error) => {
              console.error("FlowSense route change track failed:", error);
            });
          }
        }, 500);
      },
  
      async track(state) {
        if (!this.apiKey) {
          throw new Error("FlowSense.init must be called before track");
        }
  
        if (!state) {
          throw new Error("FlowSense.track requires a state");
        }
  
        // Prevent duplicate consecutive tracking
        if (this.lastTrackedState === state) {
          return { message: "Duplicate state skipped" };
        }
  
        this.lastTrackedState = state;
  
        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            sessionId: this.sessionId,
            state,
          }),
        });
  
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || "FlowSense track failed");
        }
  
        return response.json();
      },
  
      generateSessionId() {
        return "fs_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      },
  
      destroy() {
        if (this.routePoller) {
          clearInterval(this.routePoller);
          this.routePoller = null;
        }
      },
    };
  
    window.FlowSense = FlowSense;
  })(window);