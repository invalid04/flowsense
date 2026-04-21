"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectLoops = detectLoops;
function detectLoops(transitions, stateNameById) {
    const transitionCountMap = new Map();
    for (const transition of transitions) {
        const key = `${transition.fromStateId}->${transition.toStateId}`;
        transitionCountMap.set(key, Number(transition.count));
    }
    const loops = [];
    const visitedPairs = new Set();
    for (const transition of transitions) {
        const fromId = transition.fromStateId;
        const toId = transition.toStateId;
        if (fromId === toId) {
            const stateName = stateNameById.get(fromId);
            if (!stateName)
                continue;
            loops.push({
                type: "self",
                states: [stateName],
                totalCount: Number(transition.count),
            });
            continue;
        }
        const forwardKey = `${fromId}->${toId}`;
        const reverseKey = `${toId}->${fromId}`;
        if (!transitionCountMap.has(reverseKey)) {
            continue;
        }
        const pairKey = [fromId, toId].sort().join("<->");
        if (visitedPairs.has(pairKey)) {
            continue;
        }
        visitedPairs.add(pairKey);
        const fromStateName = stateNameById.get(fromId);
        const toStateName = stateNameById.get(toId);
        if (!fromStateName || !toStateName) {
            continue;
        }
        const forwardCount = transitionCountMap.get(forwardKey) ?? 0;
        const reverseCount = transitionCountMap.get(reverseKey) ?? 0;
        loops.push({
            type: "two-state",
            states: [fromStateName, toStateName],
            totalCount: forwardCount + reverseCount,
        });
    }
    loops.sort((a, b) => b.totalCount - a.totalCount);
    return {
        topLoop: loops[0] ?? null,
        loops,
    };
}
