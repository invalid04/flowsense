import { getOrCreateSessionKey } from "./session";
import type { SequenceConfig, TrackTransitionInput } from "./types";

let config: SequenceConfig | null = null;

export function initSequence(nextConfig: SequenceConfig) {
  config = nextConfig;
}

export async function trackTransition(input: TrackTransitionInput) {
  if (!config) {
    throw new Error("Sequence SDK not initialized. Call initSequence() first.");
  }

  const sessionKey = input.sessionKey ?? getOrCreateSessionKey();

  const payload = {
    sessionKey,
    fromState: input.fromState,
    toState: input.toState,
  };

  const response = await fetch(`${config.apiUrl}/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();

    if (config.debug) {
      console.error("Sequence track failed:", text);
    }

    throw new Error("Failed to track transition");
  }

  const data = await response.json();

  if (config.debug) {
    console.log("Sequence track success:", data);
  }

  return data;
}