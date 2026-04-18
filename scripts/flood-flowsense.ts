type FlowTemplate = {
  name: string;
  weight: number;
  states: string[];
};

type FloodOptions = {
  endpoint: string;
  totalSessions: number;
  minDelayMs: number;
  maxDelayMs: number;
  concurrency: number;
};

const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    name: "strong-conversion",
    weight: 30,
    states: ["/home", "/product", "/cart", "/checkout"],
  },
  {
    name: "checkout-dropoff",
    weight: 22,
    states: ["/home", "/product", "/cart"],
  },
  {
    name: "pricing-loop",
    weight: 14,
    states: ["/home", "/pricing", "/demo", "/pricing", "/demo", "/product"],
  },
  {
    name: "pricing-to-cart",
    weight: 10,
    states: ["/home", "/pricing", "/product", "/cart", "/checkout"],
  },
  {
    name: "blog-wander",
    weight: 8,
    states: ["/home", "/blog", "/home", "/product"],
  },
  {
    name: "feature-comparison-loop",
    weight: 6,
    states: ["/home", "/features", "/pricing", "/features", "/pricing", "/product"],
  },
  {
    name: "demo-to-product",
    weight: 5,
    states: ["/home", "/demo", "/product", "/cart", "/checkout"],
  },
  {
    name: "support-exit",
    weight: 3,
    states: ["/home", "/pricing", "/support"],
  },
  {
    name: "docs-exit",
    weight: 2,
    states: ["/home", "/docs", "/pricing"],
  },
];

const DEFAULT_OPTIONS: FloodOptions = {
  endpoint: "http://localhost:3000/api/dev/flood-track",
  totalSessions: 1000,
  minDelayMs: 3,
  maxDelayMs: 20,
  concurrency: 10,
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeSessionKey(index: number): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `flood-${index}-${rand}`;
}

function chooseWeightedFlow(templates: FlowTemplate[]): FlowTemplate {
  const totalWeight = templates.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const template of templates) {
    roll -= template.weight;
    if (roll <= 0) return template;
  }

  return templates[templates.length - 1];
}

function dedupeImmediateRepeats(states: string[]): string[] {
  if (states.length === 0) return states;

  const result: string[] = [states[0]];
  for (let i = 1; i < states.length; i++) {
    if (states[i] !== states[i - 1]) {
      result.push(states[i]);
    }
  }

  return result;
}

function mutateFlow(baseStates: string[]): string[] {
  const states = [...baseStates];

  if (Math.random() < 0.12 && states.length >= 2) {
    states.splice(1, 0, "/reviews");
  }

  if (Math.random() < 0.08 && states.includes("/product")) {
    const index = states.indexOf("/product");
    states.splice(index + 1, 0, "/faq");
  }

  if (Math.random() < 0.06 && states.includes("/cart")) {
    const index = states.indexOf("/cart");
    states.splice(index + 1, 0, "/pricing");
  }

  if (Math.random() < 0.07 && states[states.length - 1] === "/checkout") {
    states.push("/thank-you");
  }

  return dedupeImmediateRepeats(states);
}

function buildTransitions(sessionKey: string, states: string[]) {
  const transitions: Array<{
    sessionKey: string;
    fromState: string;
    toState: string;
  }> = [];

  for (let i = 0; i < states.length - 1; i++) {
    transitions.push({
      sessionKey,
      fromState: states[i],
      toState: states[i + 1],
    });
  }

  return transitions;
}

async function postTransition(
  endpoint: string,
  payload: {
    sessionKey: string;
    fromState: string;
    toState: string;
  }
): Promise<void> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`POST failed (${response.status}): ${text}`);
  }
}

async function sendSession(
  endpoint: string,
  sessionIndex: number,
  minDelayMs: number,
  maxDelayMs: number
): Promise<{ sessionKey: string; flowName: string; transitionsSent: number }> {
  const flow = chooseWeightedFlow(FLOW_TEMPLATES);
  const sessionKey = makeSessionKey(sessionIndex);
  const states = mutateFlow(flow.states);
  const transitions = buildTransitions(sessionKey, states);

  for (const transition of transitions) {
    await postTransition(endpoint, transition);
    await sleep(randomInt(minDelayMs, maxDelayMs));
  }

  return {
    sessionKey,
    flowName: flow.name,
    transitionsSent: transitions.length,
  };
}

async function runWorker(
  workerId: number,
  sessionIndexes: number[],
  options: FloodOptions,
  stats: Map<string, number>
): Promise<void> {
  for (const sessionIndex of sessionIndexes) {
    try {
      const result = await sendSession(
        options.endpoint,
        sessionIndex,
        options.minDelayMs,
        options.maxDelayMs
      );

      stats.set(result.flowName, (stats.get(result.flowName) ?? 0) + 1);

      if (sessionIndex % 50 === 0) {
        console.log(
          `[worker ${workerId}] session ${sessionIndex} sent (${result.flowName}, ${result.transitionsSent} transitions)`
        );
      }
    } catch (error) {
      console.error(`[worker ${workerId}] failed on session ${sessionIndex}:`, error);
    }
  }
}

function splitIntoBatches(total: number, concurrency: number): number[][] {
  const batches: number[][] = Array.from({ length: concurrency }, () => []);

  for (let i = 1; i <= total; i++) {
    batches[(i - 1) % concurrency].push(i);
  }

  return batches;
}

function parseArgs(): FloodOptions {
  const args = process.argv.slice(2);
  const options = { ...DEFAULT_OPTIONS };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--endpoint" && args[i + 1]) {
      options.endpoint = args[++i];
    } else if (arg === "--sessions" && args[i + 1]) {
      options.totalSessions = Number(args[++i]);
    } else if (arg === "--min-delay" && args[i + 1]) {
      options.minDelayMs = Number(args[++i]);
    } else if (arg === "--max-delay" && args[i + 1]) {
      options.maxDelayMs = Number(args[++i]);
    } else if (arg === "--concurrency" && args[i + 1]) {
      options.concurrency = Number(args[++i]);
    }
  }

  if (!Number.isFinite(options.totalSessions) || options.totalSessions <= 0) {
    throw new Error("Invalid --sessions value");
  }

  if (!Number.isFinite(options.concurrency) || options.concurrency <= 0) {
    throw new Error("Invalid --concurrency value");
  }

  if (options.minDelayMs < 0 || options.maxDelayMs < options.minDelayMs) {
    throw new Error("Invalid delay range");
  }

  return options;
}

async function main(): Promise<void> {
  const options = parseArgs();

  console.log("🔥 Flooding FlowSense with synthetic data...");
  console.log(`Endpoint:     ${options.endpoint}`);
  console.log(`Sessions:     ${options.totalSessions}`);
  console.log(`Concurrency:  ${options.concurrency}`);
  console.log(`Delay range:  ${options.minDelayMs}-${options.maxDelayMs}ms`);
  console.log("");

  const start = Date.now();
  const stats = new Map<string, number>();

  const batches = splitIntoBatches(options.totalSessions, options.concurrency);

  await Promise.all(
    batches.map((batch, index) => runWorker(index + 1, batch, options, stats))
  );

  const durationMs = Date.now() - start;

  console.log("");
  console.log("✅ Flood complete");
  console.log(`Duration: ${(durationMs / 1000).toFixed(1)}s`);
  console.log("Flow distribution:");

  for (const template of FLOW_TEMPLATES) {
    console.log(`- ${template.name}: ${stats.get(template.name) ?? 0} sessions`);
  }
}

main().catch((error) => {
  console.error("❌ Flood script failed:", error);
  process.exit(1);
});