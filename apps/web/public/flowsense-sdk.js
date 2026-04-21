(function (window) {
  const FlowSense = {
    apiKey: null,
    endpoint: null,
    sessionKey: null,
    lastTrackedState: null,
    routePoller: null,
    debug: false,

    init(config) {
      if (!config) {
        throw new Error("FlowSense.init requires a config object");
      }

      this.apiKey = config.apiKey || null;
      this.endpoint = config.endpoint || "https://sequence-1-pwbq.onrender.com/track";
      this.debug = Boolean(config.debug);

      const existingSessionKey = window.localStorage.getItem("flowsense_session_key");

      if (existingSessionKey) {
        this.sessionKey = existingSessionKey;
      } else {
        this.sessionKey = this.generateSessionKey();
        window.localStorage.setItem("flowsense_session_key", this.sessionKey);
      }

      const initialPath = window.location.pathname;
      this.lastTrackedState = initialPath;

      if (this.debug) {
        console.log("[FlowSense] initialized", {
          endpoint: this.endpoint,
          sessionKey: this.sessionKey,
          initialPath,
        });
      }

      // Track initial page load as an entry transition
      this.trackInitial(initialPath).catch((error) => {
        console.error("[FlowSense] initial track failed:", error);
      });

      // Track SPA route changes
      let lastPath = window.location.pathname;

      if (this.routePoller) {
        clearInterval(this.routePoller);
      }

      this.routePoller = setInterval(() => {
        const currentPath = window.location.pathname;

        if (currentPath !== lastPath) {
          const previousPath = lastPath;
          lastPath = currentPath;

          this.trackTransition(previousPath, currentPath).catch((error) => {
            console.error("[FlowSense] route change track failed:", error);
          });
        }
      }, 500);
    },

    async trackInitial(state) {
      if (!state) {
        throw new Error("FlowSense.trackInitial requires a state");
      }

      return this.send({
        sessionKey: this.sessionKey,
        fromState: state,
        toState: state,
      });
    },

    async track(state) {
      if (!state) {
        throw new Error("FlowSense.track requires a state");
      }

      if (!this.lastTrackedState) {
        this.lastTrackedState = state;
        return this.trackInitial(state);
      }

      if (this.lastTrackedState === state) {
        return { message: "Duplicate state skipped" };
      }

      const fromState = this.lastTrackedState;
      this.lastTrackedState = state;

      return this.trackTransition(fromState, state);
    },

    async trackTransition(fromState, toState) {
      if (!fromState || !toState) {
        throw new Error("FlowSense.trackTransition requires fromState and toState");
      }

      if (fromState === toState) {
        if (this.debug) {
          console.log("[FlowSense] duplicate transition skipped", { fromState, toState });
        }

        return { message: "Duplicate state skipped" };
      }

      this.lastTrackedState = toState;

      return this.send({
        sessionKey: this.sessionKey,
        fromState,
        toState,
      });
    },

    async send(payload) {
      const headers = {
        "Content-Type": "application/json",
      };

      // Keep this for future Sequence API key auth
      if (this.apiKey) {
        headers.Authorization = `Bearer ${this.apiKey}`;
      }

      if (this.debug) {
        console.log("[FlowSense] sending payload", payload);
      }

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = "FlowSense track failed";

        try {
          const error = await response.json();
          errorMessage = error.error || error.details || errorMessage;
        } catch (_) {}

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (this.debug) {
        console.log("[FlowSense] track success", data);
      }

      return data;
    },

    generateSessionKey() {
      return "fs_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    },

    destroy() {
      if (this.routePoller) {
        clearInterval(this.routePoller);
        this.routePoller = null;
      }

      if (this.debug) {
        console.log("[FlowSense] destroyed");
      }
    },
  };

  window.FlowSense = FlowSense;
})(window);
