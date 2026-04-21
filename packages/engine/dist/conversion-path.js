"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildConversionPath = buildConversionPath;
function buildConversionPath({ startState, conversionStates, transitions, maxSteps = 10, }) {
    const adjacency = new Map();
    for (const transition of transitions) {
        const key = transition.fromStateName;
        const existing = adjacency.get(key) ?? [];
        existing.push({
            fromStateName: transition.fromStateName,
            toStateName: transition.toStateName,
            count: Number(transition.count),
        });
        adjacency.set(key, existing);
    }
    for (const [stateName, edges] of adjacency.entries()) {
        edges.sort((a, b) => b.count - a.count);
        adjacency.set(stateName, edges);
    }
    const path = [startState];
    const visited = new Set([startState]);
    let currentStateName = startState;
    let endedReason = "max_steps_reached";
    for (let step = 0; step < maxSteps; step++) {
        if (step > 0 && conversionStates.has(currentStateName)) {
            endedReason = "reached_conversion_state";
            break;
        }
        const outgoing = adjacency.get(currentStateName) ?? [];
        if (outgoing.length === 0) {
            endedReason = "no_outgoing_transitions";
            break;
        }
        const next = outgoing[0];
        const nextStateName = next.toStateName;
        if (visited.has(nextStateName)) {
            endedReason = "loop_detected";
            break;
        }
        path.push(nextStateName);
        visited.add(nextStateName);
        currentStateName = nextStateName;
        if (conversionStates.has(currentStateName)) {
            endedReason = "reached_conversion_state";
            break;
        }
    }
    return {
        path,
        endedReason,
    };
}
