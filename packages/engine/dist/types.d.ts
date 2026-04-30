export type TransitionRecord = {
    fromState: string;
    toState: string;
    count: number;
};
export type OutgoingTransition = {
    toState: string;
    count: number;
    probability: number;
};
export type PredictionCandidateInput = {
    toStateName: string;
    count: number;
};
export type PredictionResult = {
    prediction: string | null;
    probability: number | null;
    totalTransitions: number;
};
export type LoopType = "two-state" | "self";
export type LoopResult = {
    type: LoopType;
    states: string[];
    totalCount: number;
};
export type RawTransitionInput = {
    fromStateId: string;
    toStateId: string;
    count: number;
};
export type LoopDetectionResult = {
    topLoop: LoopResult | null;
    loops: LoopResult[];
};
export type DropoffCandidateInput = {
    stateId: string;
    stateName: string;
    incomingCount: number;
    outgoingCount: number;
};
export type DropoffCandidateResult = {
    stateId: string;
    stateName: string;
    incomingCount: number;
    outgoingCount: number;
};
export type DropoffDetectionResult = {
    biggestDropoff: DropoffCandidateResult | null;
    candidates: DropoffCandidateResult[];
};
export type ConversionPathEndedReason = "reached_conversion_state" | "no_outgoing_transitions" | "loop_detected" | "max_steps_reached";
export type ConversionPathEdgeInput = {
    fromStateName: string;
    toStateName: string;
    count: number;
};
export type ConversionPathResult = {
    path: string[];
    endedReason: ConversionPathEndedReason;
};
export type SequenceAction = {
    type: "dropoff_warning";
    state: string;
    score: number;
    message: string;
} | {
    type: "loop_warning";
    states: string[];
    score: number;
    message: string;
};
export type TransitionSummary = {
    fromState: string;
    toState: string;
    count: number;
};
export type EvaluateActionsInput = {
    currentState: string;
    transitions: TransitionSummary[];
    sessionPath?: {
        state: string;
        occurredAt: Date;
    }[];
};
