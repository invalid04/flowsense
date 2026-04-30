import type { SequenceAction, EvaluateActionsInput } from "./types";
export declare function evaluateActions({ currentState, transitions, sessionPath, }: EvaluateActionsInput): SequenceAction[];
