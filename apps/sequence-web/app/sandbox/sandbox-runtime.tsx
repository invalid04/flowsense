"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./sandbox.module.css";

type RuntimeState =
  | "landing"
  | "pricing"
  | "product/home-assistant"
  | "cart"
  | "checkout"
  | "exit"
  | "success";

type Transition = {
  to: RuntimeState;
  weight: number;
};

type Prediction = {
  label: RuntimeState;
  probability: number;
};

type ModePreset = "ecommerce" | "saas" | "onboarding" | "support" | "gaming";

type EventEntry = {
  id: number;
  state: RuntimeState;
  timestamp: string;
};
type Scenario = "none" | "hesitation" | "dropoff" | "conversion" | "loop";
type EdgeKey = `${RuntimeState}->${RuntimeState}`;

type PresetConfig = {
  label: string;
  sessionPrefix: string;
  transitionsPerMinBase: number;
  activeSessionsBase: number;
  actionsBase: number;
  transitionDelay: [number, number];
  transitions: Record<RuntimeState, Transition[]>;
};

const DEFAULT_NODES: Array<{ id: RuntimeState; x: number; y: number }> = [
  { id: "landing", x: 14, y: 54 },
  { id: "product/home-assistant", x: 32, y: 26 },
  { id: "pricing", x: 42, y: 52 },
  { id: "cart", x: 58, y: 46 },
  { id: "checkout", x: 73, y: 52 },
  { id: "exit", x: 84, y: 23 },
  { id: "success", x: 88, y: 74 },
];

const PRESET_NODE_POSITIONS: Record<ModePreset, Array<{ id: RuntimeState; x: number; y: number }>> = {
  ecommerce: [
    { id: "landing", x: 12, y: 56 },
    { id: "product/home-assistant", x: 32, y: 24 },
    { id: "pricing", x: 42, y: 52 },
    { id: "cart", x: 60, y: 47 },
    { id: "checkout", x: 74, y: 54 },
    { id: "exit", x: 87, y: 20 },
    { id: "success", x: 89, y: 77 },
  ],
  saas: [
    { id: "landing", x: 14, y: 50 },
    { id: "pricing", x: 34, y: 44 },
    { id: "product/home-assistant", x: 42, y: 22 },
    { id: "cart", x: 54, y: 62 },
    { id: "checkout", x: 71, y: 50 },
    { id: "exit", x: 87, y: 26 },
    { id: "success", x: 88, y: 76 },
  ],
  onboarding: [
    { id: "landing", x: 10, y: 52 },
    { id: "product/home-assistant", x: 28, y: 33 },
    { id: "pricing", x: 40, y: 53 },
    { id: "cart", x: 57, y: 57 },
    { id: "checkout", x: 73, y: 47 },
    { id: "exit", x: 87, y: 32 },
    { id: "success", x: 89, y: 72 },
  ],
  support: [
    { id: "landing", x: 12, y: 49 },
    { id: "product/home-assistant", x: 31, y: 35 },
    { id: "pricing", x: 39, y: 56 },
    { id: "cart", x: 55, y: 52 },
    { id: "checkout", x: 68, y: 50 },
    { id: "exit", x: 86, y: 22 },
    { id: "success", x: 87, y: 78 },
  ],
  gaming: [
    { id: "landing", x: 11, y: 60 },
    { id: "product/home-assistant", x: 30, y: 21 },
    { id: "pricing", x: 45, y: 50 },
    { id: "cart", x: 56, y: 35 },
    { id: "checkout", x: 72, y: 56 },
    { id: "exit", x: 88, y: 18 },
    { id: "success", x: 89, y: 80 },
  ],
};

const PRESETS: Record<ModePreset, PresetConfig> = {
  ecommerce: {
    label: "E-Commerce",
    sessionPrefix: "sess",
    transitionsPerMinBase: 18204,
    activeSessionsBase: 2491,
    actionsBase: 331,
    transitionDelay: [620, 1120],
    transitions: {
      landing: [
        { to: "product/home-assistant", weight: 0.5 },
        { to: "pricing", weight: 0.35 },
        { to: "exit", weight: 0.15 },
      ],
      pricing: [
        { to: "pricing", weight: 0.34 },
        { to: "cart", weight: 0.33 },
        { to: "product/home-assistant", weight: 0.2 },
        { to: "exit", weight: 0.13 },
      ],
      "product/home-assistant": [
        { to: "pricing", weight: 0.45 },
        { to: "cart", weight: 0.32 },
        { to: "exit", weight: 0.23 },
      ],
      cart: [
        { to: "checkout", weight: 0.59 },
        { to: "pricing", weight: 0.2 },
        { to: "exit", weight: 0.21 },
      ],
      checkout: [
        { to: "success", weight: 0.72 },
        { to: "exit", weight: 0.28 },
      ],
      exit: [{ to: "landing", weight: 1 }],
      success: [{ to: "landing", weight: 1 }],
    },
  },
  saas: {
    label: "SaaS",
    sessionPrefix: "org",
    transitionsPerMinBase: 9260,
    activeSessionsBase: 1182,
    actionsBase: 104,
    transitionDelay: [720, 1320],
    transitions: {
      landing: [
        { to: "pricing", weight: 0.44 },
        { to: "product/home-assistant", weight: 0.33 },
        { to: "exit", weight: 0.23 },
      ],
      pricing: [
        { to: "pricing", weight: 0.41 },
        { to: "checkout", weight: 0.22 },
        { to: "cart", weight: 0.19 },
        { to: "exit", weight: 0.18 },
      ],
      "product/home-assistant": [
        { to: "pricing", weight: 0.52 },
        { to: "cart", weight: 0.16 },
        { to: "exit", weight: 0.32 },
      ],
      cart: [
        { to: "checkout", weight: 0.45 },
        { to: "pricing", weight: 0.28 },
        { to: "exit", weight: 0.27 },
      ],
      checkout: [
        { to: "success", weight: 0.63 },
        { to: "exit", weight: 0.37 },
      ],
      exit: [{ to: "landing", weight: 1 }],
      success: [{ to: "landing", weight: 1 }],
    },
  },
  onboarding: {
    label: "Onboarding",
    sessionPrefix: "onb",
    transitionsPerMinBase: 12140,
    activeSessionsBase: 1610,
    actionsBase: 218,
    transitionDelay: [560, 980],
    transitions: {
      landing: [
        { to: "product/home-assistant", weight: 0.57 },
        { to: "pricing", weight: 0.22 },
        { to: "exit", weight: 0.21 },
      ],
      pricing: [
        { to: "product/home-assistant", weight: 0.42 },
        { to: "cart", weight: 0.24 },
        { to: "pricing", weight: 0.2 },
        { to: "exit", weight: 0.14 },
      ],
      "product/home-assistant": [
        { to: "cart", weight: 0.38 },
        { to: "pricing", weight: 0.3 },
        { to: "checkout", weight: 0.2 },
        { to: "exit", weight: 0.12 },
      ],
      cart: [
        { to: "checkout", weight: 0.51 },
        { to: "pricing", weight: 0.25 },
        { to: "exit", weight: 0.24 },
      ],
      checkout: [
        { to: "success", weight: 0.68 },
        { to: "exit", weight: 0.32 },
      ],
      exit: [{ to: "landing", weight: 1 }],
      success: [{ to: "landing", weight: 1 }],
    },
  },
  support: {
    label: "Support",
    sessionPrefix: "sup",
    transitionsPerMinBase: 6880,
    activeSessionsBase: 804,
    actionsBase: 412,
    transitionDelay: [760, 1360],
    transitions: {
      landing: [
        { to: "product/home-assistant", weight: 0.4 },
        { to: "pricing", weight: 0.21 },
        { to: "exit", weight: 0.39 },
      ],
      pricing: [
        { to: "product/home-assistant", weight: 0.35 },
        { to: "pricing", weight: 0.25 },
        { to: "exit", weight: 0.4 },
      ],
      "product/home-assistant": [
        { to: "cart", weight: 0.18 },
        { to: "pricing", weight: 0.26 },
        { to: "exit", weight: 0.56 },
      ],
      cart: [
        { to: "checkout", weight: 0.29 },
        { to: "pricing", weight: 0.25 },
        { to: "exit", weight: 0.46 },
      ],
      checkout: [
        { to: "success", weight: 0.44 },
        { to: "exit", weight: 0.56 },
      ],
      exit: [{ to: "landing", weight: 1 }],
      success: [{ to: "landing", weight: 1 }],
    },
  },
  gaming: {
    label: "Gaming",
    sessionPrefix: "gm",
    transitionsPerMinBase: 26400,
    activeSessionsBase: 5890,
    actionsBase: 950,
    transitionDelay: [360, 760],
    transitions: {
      landing: [
        { to: "product/home-assistant", weight: 0.6 },
        { to: "pricing", weight: 0.2 },
        { to: "exit", weight: 0.2 },
      ],
      pricing: [
        { to: "pricing", weight: 0.5 },
        { to: "cart", weight: 0.2 },
        { to: "product/home-assistant", weight: 0.15 },
        { to: "exit", weight: 0.15 },
      ],
      "product/home-assistant": [
        { to: "cart", weight: 0.35 },
        { to: "pricing", weight: 0.35 },
        { to: "checkout", weight: 0.1 },
        { to: "exit", weight: 0.2 },
      ],
      cart: [
        { to: "checkout", weight: 0.38 },
        { to: "pricing", weight: 0.28 },
        { to: "product/home-assistant", weight: 0.22 },
        { to: "exit", weight: 0.12 },
      ],
      checkout: [
        { to: "success", weight: 0.61 },
        { to: "exit", weight: 0.39 },
      ],
      exit: [{ to: "landing", weight: 1 }],
      success: [{ to: "landing", weight: 1 }],
    },
  },
};

function chooseNextState(state: RuntimeState, transitions: Record<RuntimeState, Transition[]>): RuntimeState {
  const options = transitions[state];
  const roll = Math.random();
  let cumulative = 0;
  for (const option of options) {
    cumulative += option.weight;
    if (roll <= cumulative) return option.to;
  }
  return options[options.length - 1].to;
}

function computePredictions(state: RuntimeState, transitions: Record<RuntimeState, Transition[]>): Prediction[] {
  return [...transitions[state]]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((item) => ({ label: item.to, probability: item.weight }));
}

function deriveBehaviorState(events: RuntimeState[]): string {
  const lastFive = events.slice(-5);
  const pricingCount = lastFive.filter((event) => event === "pricing").length;
  if (pricingCount >= 3) return "hesitation_loop";
  if (lastFive.includes("checkout")) return "commit_intent";
  if (lastFive.includes("exit")) return "dropoff_risk";
  return "exploration";
}

function deriveAction(events: RuntimeState[], state: RuntimeState, preset: ModePreset) {
  const behaviorState = deriveBehaviorState(events);
  if (behaviorState === "hesitation_loop") {
    const names: Record<ModePreset, string> = {
      ecommerce: "offer_coupon",
      saas: "offer_extended_trial",
      onboarding: "trigger_guided_tour",
      support: "route_priority_agent",
      gaming: "grant_retention_boost",
    };
    return {
      name: names[preset],
      confidence: 0.84,
      reasoning: ["loop detected", "hesitation threshold exceeded", "recovery probability: high"],
    };
  }
  if (state === "checkout") {
    const names: Record<ModePreset, string> = {
      ecommerce: "trigger_fast_checkout",
      saas: "open_assisted_checkout",
      onboarding: "offer_setup_shortcut",
      support: "confirm_resolution_gate",
      gaming: "surface_bundle_offer",
    };
    return {
      name: names[preset],
      confidence: 0.79,
      reasoning: ["checkout propensity rising", "friction-sensitive moment", "completion probability: elevated"],
    };
  }
  if (state === "exit") {
    const names: Record<ModePreset, string> = {
      ecommerce: "trigger_reengagement_email",
      saas: "schedule_success_outreach",
      onboarding: "resume_flow_reminder",
      support: "escalate_human_assist",
      gaming: "push_return_mission",
    };
    return {
      name: names[preset],
      confidence: 0.68,
      reasoning: ["exit event observed", "high-value path abandoned", "win-back probability: moderate"],
    };
  }
  return {
    name: "hold_context",
    confidence: 0.61,
    reasoning: ["signal still forming", "insufficient confidence for intervention", "continue passive observation"],
  };
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function confidenceForEdge(from: RuntimeState, to: RuntimeState, transitions: Record<RuntimeState, Transition[]>) {
  const found = transitions[from].find((item) => item.to === to);
  return found?.weight ?? 0.06;
}

function getNode(nodeId: RuntimeState, nodes: Array<{ id: RuntimeState; x: number; y: number }>) {
  return nodes.find((node) => node.id === nodeId);
}

function pathDefinition(from: RuntimeState, to: RuntimeState, nodes: Array<{ id: RuntimeState; x: number; y: number }>): string {
  const source = getNode(from, nodes);
  const target = getNode(to, nodes);
  if (!source || !target) return "";
  if (from === to) {
    const left = source.x - 4;
    const top = source.y - 12;
    return `M ${source.x} ${source.y} C ${left} ${top}, ${source.x + 8} ${top}, ${source.x + 6} ${source.y - 1}`;
  }
  const curve = from === "checkout" && to === "exit" ? -12 : to === "success" ? 14 : -6;
  const dx = target.x - source.x;
  const c1x = source.x + dx * 0.34;
  const c2x = source.x + dx * 0.68;
  return `M ${source.x} ${source.y} C ${c1x} ${source.y + curve}, ${c2x} ${target.y + curve}, ${target.x} ${target.y}`;
}

export default function SandboxRuntime() {
  const [preset, setPreset] = useState<ModePreset>("ecommerce");
  const config = PRESETS[preset];
  const nodes = PRESET_NODE_POSITIONS[preset] ?? DEFAULT_NODES;
  const links = useMemo(
    () =>
      Object.entries(config.transitions).flatMap(([from, transitions]) =>
        transitions.map((transition) => ({ from: from as RuntimeState, to: transition.to })),
      ),
    [config.transitions],
  );
  const initialSessionId = `${config.sessionPrefix}_77f`;

  const [events, setEvents] = useState<RuntimeState[]>(["landing"]);
  const [streamEntries, setStreamEntries] = useState<EventEntry[]>([{ id: 0, state: "landing", timestamp: formatTime(new Date()) }]);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [activeState, setActiveState] = useState<RuntimeState>("landing");
  const [activeEdge, setActiveEdge] = useState<{ from: RuntimeState; to: RuntimeState }>({ from: "landing", to: "pricing" });
  const [isRunning, setIsRunning] = useState(true);
  const [actionCount, setActionCount] = useState(0);
  const [transitionCount, setTransitionCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(config.activeSessionsBase);
  const [statePath, setStatePath] = useState<string[]>(["exploration"]);
  const [scenario, setScenario] = useState<Scenario>("none");
  const [hoveredEdge, setHoveredEdge] = useState<EdgeKey | null>(null);
  const [emitBurst, setEmitBurst] = useState(false);
  const [emitNodeFlash, setEmitNodeFlash] = useState<RuntimeState | null>(null);
  const entryIdRef = useRef(1);

  const behaviorState = deriveBehaviorState(events);
  const predictions = useMemo(() => computePredictions(activeState, config.transitions), [activeState, config.transitions]);
  const action = useMemo(() => deriveAction(events, activeState, preset), [events, activeState, preset]);

  useEffect(() => {
    if (!isRunning) return;
    let cancelled = false;
    let timeout: number;

    const tick = () => {
      const [minDelay, maxDelay] = config.transitionDelay;
      timeout = window.setTimeout(() => {
        if (cancelled) return;
        setEvents((current) => {
          const from = current[current.length - 1];
          let next: RuntimeState;
          if (scenario === "hesitation" && from === "pricing") next = Math.random() > 0.35 ? "pricing" : "cart";
          else if (scenario === "dropoff") next = from === "checkout" ? "exit" : Math.random() > 0.58 ? "exit" : chooseNextState(from, config.transitions);
          else if (scenario === "conversion") next = from === "cart" ? "checkout" : from === "checkout" ? "success" : chooseNextState(from, config.transitions);
          else if (scenario === "loop") next = from === "pricing" ? "product/home-assistant" : from === "product/home-assistant" ? "pricing" : chooseNextState(from, config.transitions);
          else next = chooseNextState(from, config.transitions);
          setActiveState(next);
          setActiveEdge({ from, to: next });
          setTransitionCount((value) => value + 1);
          setSessionCount((value) => value + (Math.random() > 0.72 ? 1 : 0));
          const nextId = entryIdRef.current++;
          setStreamEntries((entries) => [...entries.slice(-15), { id: nextId, state: next, timestamp: formatTime(new Date()) }]);
          return [...current.slice(-15), next];
        });
        tick();
      }, minDelay + Math.floor(Math.random() * (maxDelay - minDelay)));
    };

    tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [config.transitionDelay, config.transitions, isRunning]);

  useEffect(() => {
    if (action.name !== "hold_context") {
      setActionCount((value) => value + 1);
      setEmitBurst(true);
      setEmitNodeFlash(activeState);
      const t = window.setTimeout(() => {
        setEmitBurst(false);
        setEmitNodeFlash(null);
      }, 700);
      return () => window.clearTimeout(t);
    }
  }, [action.name]);

  useEffect(() => {
    setStatePath((current) => {
      if (current[current.length - 1] === behaviorState) return current;
      return [...current.slice(-2), behaviorState];
    });
  }, [behaviorState]);

  useEffect(() => {
    setEvents(["landing"]);
    setStreamEntries([{ id: 0, state: "landing", timestamp: formatTime(new Date()) }]);
    entryIdRef.current = 1;
    setStatePath(["exploration"]);
    setActiveState("landing");
    setActiveEdge({ from: "landing", to: "pricing" });
    setSessionId(`${config.sessionPrefix}_${Math.floor(100 + Math.random() * 900).toString(16)}`);
    setSessionCount(config.activeSessionsBase);
    setTransitionCount(0);
    setActionCount(0);
  }, [config.activeSessionsBase, config.sessionPrefix]);

  const predictedEdge = predictions[0] ? { from: activeState, to: predictions[0].label } : { from: activeState, to: activeState };
  const hoveredEdgeStats = useMemo(() => {
    if (!hoveredEdge) return null;
    const [from, to] = hoveredEdge.split("->") as [RuntimeState, RuntimeState];
    const probability = confidenceForEdge(from, to, config.transitions);
    const sessions = Math.floor(config.activeSessionsBase * probability * 6.2);
    const avgSeconds = Math.max(6, Math.round((1 - probability) * 30));
    return { from, to, probability, sessions, avgSeconds };
  }, [hoveredEdge, config.activeSessionsBase, config.transitions]);

  return (
    <main className={styles.sandboxShell}>
      <section className={`${styles.runtimeHeader} content-container`}>
        <div>
          <p className={`${styles.kicker} tech-label`}>Sequence Sandbox</p>
          <h1 className={styles.title}>Adaptive Behavior Runtime</h1>
          <p className={styles.subtitle}>Live runtime console for traffic generation, sequence formation, predictive routing, and action orchestration.</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <p className={`${styles.metricLabel} tech-label`}>Active Sessions</p>
              <p className={styles.metricValue}>{sessionCount.toLocaleString("en-US")}</p>
            </div>
            <div className={styles.metricCard}>
              <p className={`${styles.metricLabel} tech-label`}>Transitions / Min</p>
              <p className={styles.metricValue}>{(config.transitionsPerMinBase + transitionCount * 11).toLocaleString("en-US")}</p>
            </div>
            <div className={styles.metricCard}>
              <p className={`${styles.metricLabel} tech-label`}>Actions Emitted</p>
              <p className={styles.metricValue}>{(config.actionsBase + actionCount).toLocaleString("en-US")}</p>
            </div>
          </div>
          <div className={styles.controls}>
            <button className={styles.controlButton} onClick={() => setIsRunning((prev) => !prev)} type="button">
              {isRunning ? "Pause Stream" : "Generate Traffic"}
            </button>
            <button
              className={styles.controlButtonGhost}
              onClick={() => {
                setIsRunning(true);
                setEvents(["landing"]);
                setStreamEntries([{ id: 0, state: "landing", timestamp: formatTime(new Date()) }]);
                entryIdRef.current = 1;
                setStatePath(["exploration"]);
                setActiveState("landing");
                setActiveEdge({ from: "landing", to: "pricing" });
                setSessionId(`${config.sessionPrefix}_${Math.floor(100 + Math.random() * 900).toString(16)}`);
              }}
              type="button"
            >
              Reset Session
            </button>
          </div>
          <div className={styles.modeRow}>
            {(Object.keys(PRESETS) as ModePreset[]).map((mode) => (
              <button key={mode} className={mode === preset ? styles.modeButtonActive : styles.modeButton} onClick={() => setPreset(mode)} type="button">
                {PRESETS[mode].label}
              </button>
            ))}
          </div>
          <div className={styles.modeRow}>
            <button className={scenario === "hesitation" ? styles.modeButtonActive : styles.modeButton} onClick={() => setScenario("hesitation")} type="button">
              Trigger Hesitation
            </button>
            <button className={scenario === "dropoff" ? styles.modeButtonActive : styles.modeButton} onClick={() => setScenario("dropoff")} type="button">
              Simulate Dropoff
            </button>
            <button className={scenario === "conversion" ? styles.modeButtonActive : styles.modeButton} onClick={() => setScenario("conversion")} type="button">
              Trigger Conversion
            </button>
            <button className={scenario === "loop" ? styles.modeButtonActive : styles.modeButton} onClick={() => setScenario("loop")} type="button">
              Generate Loop
            </button>
            <button className={scenario === "none" ? styles.modeButtonActive : styles.modeButton} onClick={() => setScenario("none")} type="button">
              Live Model
            </button>
          </div>
        </div>
      </section>

      <section className={`${styles.runtimeGrid} content-container`}>
        <article className={styles.panel}>
          <p className={`${styles.panelLabel} tech-label`}>Event Stream</p>
          <div className={styles.terminal}>
            {streamEntries.map((entry, idx) => (
              <p key={entry.id} className={styles.streamLine} style={{ animationDelay: `${idx * 70}ms` }}>
                <span className={styles.timestamp}>{entry.timestamp}</span>
                <span>{idx === 0 ? entry.state : `-> ${entry.state}`}</span>
              </p>
            ))}
            <p className={styles.cursor}>_</p>
          </div>
          <div className={styles.metaSection}>
            <p className={`${styles.metaLabel} tech-label`}>Session</p>
            <p className={styles.metaValue}>{sessionId}</p>
          </div>
          <div className={styles.metaSection}>
            <p className={`${styles.metaLabel} tech-label`}>State</p>
            <p className={styles.metaValue}>{behaviorState}</p>
          </div>
        </article>

        <article className={styles.topologyPanel}>
          <p className={`${styles.panelLabel} tech-label`}>Behavioral Topology</p>
          <svg viewBox="0 0 100 100" className={styles.graph} role="img" aria-label="Live sequence topology">
            <defs>
              <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>
            {links.map((link) => {
              const active = activeEdge.from === link.from && activeEdge.to === link.to;
              const predicted = predictedEdge.from === link.from && predictedEdge.to === link.to;
              const confidence = confidenceForEdge(link.from, link.to, config.transitions);
              const confClass = confidence < 0.24 ? styles.edgeLowConfidence : styles.edgePrediction;
              return (
                <g
                  key={`${link.from}-${link.to}`}
                  onMouseEnter={() => setHoveredEdge(`${link.from}->${link.to}`)}
                  onMouseLeave={() => setHoveredEdge(null)}
                >
                  <path d={pathDefinition(link.from, link.to, nodes)} className={styles.edgeBase} />
                  <path
                    d={pathDefinition(link.from, link.to, nodes)}
                    className={active || emitBurst ? styles.edgeActive : predicted ? styles.edgePredictedHot : confClass}
                    style={{ opacity: Math.max(0.18, confidence + (active ? 0.2 : 0)) }}
                  />
                </g>
              );
            })}
            {nodes.map((node) => {
              const hot = node.id === activeState;
              const emitted = emitNodeFlash === node.id;
              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={hot ? 6.3 : 4.2}
                    fill="url(#nodeGlow)"
                    className={emitted ? styles.nodeEmit : hot ? styles.nodePulse : ""}
                  />
                  <circle cx={node.x} cy={node.y} r={hot ? 2.3 : 1.65} className={hot ? styles.nodeCoreHot : styles.nodeCore} />
                  <text x={node.x} y={node.y + 10} className={styles.nodeLabel}>
                    {node.id}
                  </text>
                </g>
              );
            })}
            {hoveredEdgeStats && (
              <g className={styles.edgeTooltip}>
                <rect x="58" y="5" width="38" height="18" rx="1.8" ry="1.8" className={styles.edgeTooltipBg} />
                <text x="60" y="10.2" className={styles.edgeTooltipText}>
                  {hoveredEdgeStats.from} to {hoveredEdgeStats.to}
                </text>
                <text x="60" y="13.4" className={styles.edgeTooltipText}>
                  prob: {Math.round(hoveredEdgeStats.probability * 100)}%
                </text>
                <text x="60" y="16.6" className={styles.edgeTooltipText}>
                  sessions: {hoveredEdgeStats.sessions.toLocaleString("en-US")}
                </text>
                <text x="60" y="19.8" className={styles.edgeTooltipText}>
                  avg: {hoveredEdgeStats.avgSeconds}s
                </text>
              </g>
            )}
          </svg>
        </article>

        <article className={styles.panel}>
          <p className={`${styles.panelLabel} tech-label`}>Runtime Intelligence</p>
          <div className={styles.block}>
            <p className={`${styles.blockLabel} tech-label`}>State Transition</p>
            {statePath.map((state, idx) => (
              <p className={styles.transitionState} key={`${state}-${idx}`}>
                {state}
              </p>
            ))}
            <p className={styles.transitionArrow}>v</p>
            <p className={styles.transitionAction}>action: {action.name}</p>
          </div>
          <div className={styles.block}>
            <p className={`${styles.blockLabel} tech-label`}>Prediction</p>
            {predictions.map((item) => (
              <div key={item.label} className={styles.row}>
                <span>{item.label}</span>
                <div className={styles.predictionMeter}>
                  <span className={styles.predictionBar} style={{ width: `${Math.max(8, Math.round(item.probability * 100))}%` }} />
                </div>
                <span>{Math.round(item.probability * 100)}%</span>
              </div>
            ))}
          </div>
          <div className={`${styles.block} ${styles.actionBlock} ${emitBurst ? styles.actionEmit : ""}`} key={`${action.name}-${action.confidence.toFixed(2)}`}>
            <p className={`${styles.blockLabel} tech-label`}>Action Emitted</p>
            <p className={styles.actionName}>{action.name}</p>
            <p className={styles.muted}>confidence: <span className={styles.confidencePulse}>{action.confidence.toFixed(2)}</span></p>
          </div>
          <div className={styles.block}>
            <p className={`${styles.blockLabel} tech-label`}>Reasoning</p>
            {action.reasoning.map((line) => (
              <p key={line} className={styles.reasoningLine}>
                {line}
              </p>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
