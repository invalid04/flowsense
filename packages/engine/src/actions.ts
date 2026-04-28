import type { SequenceAction, TransitionSummary, EvaluateActionsInput } from "./types";

export function evaluateActions({
    currentState,
    transitions,
}: EvaluateActionsInput): SequenceAction[] {
    const outgoingTransitions = transitions.filter(
        (transition) => transition.fromState === currentState
    );

    if (outgoingTransitions.length === 0) {
        return [];
    }

    const totalOutgoingCount = outgoingTransitions.reduce(
        (sum, transition) => sum + transition.count,
        0
    );

    if (totalOutgoingCount === 0) {
        return [];
    }

    const exitTransition = outgoingTransitions.find((transition) => {
        const toState = transition.toState.toLowerCase();

        return (
            toState === "exit" ||
            toState === "dropoff" ||
            toState === "leave" ||
            toState === "__exit__"
        );
    });

    const exitCount = exitTransition?.count ?? 0;
    const exitProbability = exitCount / totalOutgoingCount;

    if (exitProbability < 0.4) {
        return [];
    }

    return [
        {
            type: "dropoff_warning",
            state: currentState,
            score: Number(exitProbability.toFixed(2)),
            message: `Users often leave from ${currentState}. Consider showing help, reassurance, or a strong CTA here.`,
        },
    ];
}