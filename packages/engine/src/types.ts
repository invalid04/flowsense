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
}

export type DropoffResult = {
    state: string;
    incoming: number;
    outgoing: number;
    dropoffRate: number;
};

export type ConversionPathResult = {
    path: string[];
    probability: number;
    reachedConversion: boolean;
}