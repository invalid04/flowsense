"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateActions = evaluateActions;
function detectSessionLoop(sessionPath) {
    const recentStates = sessionPath.slice(-5).map((step) => step.state);
    if (recentStates.length < 4) {
        return [];
    }
    const last = recentStates[recentStates.length - 1];
    const prev = recentStates[recentStates.length - 2];
    const third = recentStates[recentStates.length - 3];
    const fourth = recentStates[recentStates.length - 4];
    const isAlternateLoop = fourth === prev &&
        third === last &&
        last !== prev;
    if (!isAlternateLoop) {
        return [];
    }
    return [
        {
            type: "coupon_offer",
            reason: "pricing_loop_detected",
            states: [prev, last],
            message: "This user appears stuck between two steps. Consider showing a coupon, reassurance, or help prompt."
        }
    ];
}
function evaluateActions({ currentState, transitions, sessionPath, }) {
    const actions = [];
    if (sessionPath) {
        actions.push(...detectSessionLoop(sessionPath));
    }
    const outgoing = transitions.filter((t) => t.fromState === currentState);
    if (outgoing.length > 0) {
        const total = outgoing.reduce((sum, t) => sum + t.count, 0);
        const exit = outgoing.find((t) => {
            const to = t.toState.toLowerCase();
            return (to === "exit" ||
                to === "dropoff" ||
                to === "leave" ||
                to === "__exit__");
        });
        const exitProb = (exit?.count ?? 0) / total;
        if (exitProb >= 0.4) {
            actions.push({
                type: "dropoff_warning",
                state: currentState,
                score: Number(exitProb.toFixed(2)),
                message: `Users often leave from ${currentState}`,
            });
        }
    }
    const loopCandidates = [];
    for (const t1 of transitions) {
        for (const t2 of transitions) {
            if (t1.fromState === t2.toState &&
                t1.toState === t2.fromState &&
                t1.fromState !== t1.toState) {
                const total = t1.count + t2.count;
                if (total >= 5) {
                    const balance = Math.min(t1.count, t2.count) / Math.max(t1.count, t2.count);
                    loopCandidates.push({
                        a: t1.fromState,
                        b: t1.toState,
                        score: balance,
                    });
                }
            }
        }
    }
    if (loopCandidates.length > 0) {
        const best = loopCandidates.sort((a, b) => b.score - a.score)[0];
        if (best.score >= 0.5) {
            actions.push({
                type: "loop_warning",
                states: [best.a, best.b],
                score: Number(best.score.toFixed(2)),
                message: `Users often bounce between ${best.a} and ${best.b} without progressing`,
            });
        }
    }
    return actions;
}
