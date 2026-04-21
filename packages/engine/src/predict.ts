import type { PredictionCandidateInput, PredictionResult } from "./types";

export function predictFromCandidates(
    candidates: PredictionCandidateInput[],
): PredictionResult {
    if (candidates.length === 0) {
        return {
            prediction: null,
            probability: null,
            totalTransitions: 0,
        };
    }

    const normalized = candidates.map((candidate) => ({
        toStateName: candidate.toStateName,
        count: Number(candidate.count),
    }));

    const totalTransitions = normalized.reduce(
        (sum, candidate) => sum + candidate.count,
        0,
    );

    if (totalTransitions === 0) {
        return {
            prediction: null,
            probability: null,
            totalTransitions: 0,
        };
    }

    const top = [...normalized].sort((a, b) => b.count - a.count)[0];

    return {
        prediction: top.toStateName,
        probability: top.count / totalTransitions,
        totalTransitions,
    }
}